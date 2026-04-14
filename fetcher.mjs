import fs from 'fs';

const DELAY_MS = 250; // High speed (0.25s) because SteamSpy is more lenient
const BATCH_SIZE = 10; // Processing 10 at a time
const OUTPUT_PATH = './public/games-new.json';

// Scoring
function calculatePrestige(pos, neg, isFree) {
    const total = pos + neg;
    if (total === 0) return 0;

    const z = 1.96;
    const phat = pos / total;
    const wilson = (phat + z * z / (2 * total) - z * Math.sqrt((phat * (1 - phat) + z * z / (4 * total)) / total)) / (1 + z * z / total);

    const popularity = Math.log10(total);

    const handicap = isFree ? 0.7 : 1.0;

    return wilson * popularity * handicap;
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Fetches detailed info from SteamSpy (faster than Official Steam API)
async function fetchGameDetails(appid) {
    const url = `https://steamspy.com/api.php?request=appdetails&appid=${appid}`;
    try {
        const response = await fetch(url);
        if (response.status === 429) {
            await sleep(5000);
            return null;
        }
        return await response.json();
    } catch (e) {
        return null;
    }
}

async function fetchSteamSpyPage(page) {
    const url = `https://steamspy.com/api.php?request=all&page=${page}`;
    try {
        const response = await fetch(url);
        return await response.json();
    } catch (e) {
        return {};
    }
}

function loadProgress() {
    if (fs.existsSync(OUTPUT_PATH)) {
        try {
            return JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'));
        } catch (e) {
            return [];
        }
    }
    return [];
}

async function runEnrichment(depth = 10) {
    try {
        let finalGames = loadProgress();
        const completedIds = new Set(finalGames.map(g => g.id));

        console.log("Gathering master list from SteamSpy...");
        const allPagesData = await Promise.all(
            Array.from({ length: depth }, (_, i) => fetchSteamSpyPage(i))
        );

        const gamesMap = new Map();
        allPagesData.forEach(pageData => {
            Object.values(pageData).forEach(game => {
                if (game.appid) gamesMap.set(game.appid, game);
            });
        });

        const gamesArray = Array.from(gamesMap.values())
            .filter(game => (game.positive + game.negative) > 150 && game.name)
            .map(game => ({
                ...game,
                calcScore: calculatePrestige(game.positive, game.negative, game.price === "0")
            }));

        gamesArray.sort((a, b) => b.calcScore - a.calcScore);
        const pendingGames = gamesArray.filter(g => !completedIds.has(g.appid));
        const total = gamesArray.length;

        console.log(`Starting High-Speed Enrichment for ${pendingGames.length} games...`);

        for (let i = 0; i < pendingGames.length; i += BATCH_SIZE) {
            const batch = pendingGames.slice(i, i + BATCH_SIZE);
            
            const results = await Promise.all(batch.map(async (baseGame) => {
                const masterIndex = gamesArray.findIndex(g => g.appid === baseGame.appid);
                const percentile = (masterIndex / total) * 100;
                
                let rarity = "COMMON";
                if (percentile < 0.10) rarity = "CELESTIAL";
                else if (percentile < 0.60) rarity = "EXOTIC";
                else if (percentile < 1.50) rarity = "MYTHIC";
                else if (percentile < 4.0) rarity = "LEGENDARY";
                else if (percentile < 14.0) rarity = "EPIC";
                else if (percentile < 30.0) rarity = "RARE";
                else if (percentile < 60.0) rarity = "UNCOMMON";

                const details = await fetchGameDetails(baseGame.appid);
                
                if (details) {
                    const isSpecial = ["CELESTIAL", "EXOTIC", "MYTHIC", "LEGENDARY"].includes(rarity);
                    
                    const tags = details.tags ? Object.keys(details.tags) : [];
                    const category = tags.includes("VR") ? "VR" : (tags[0] || "Indie");

                    return {
                        id: baseGame.appid,
                        name: baseGame.name,
                        category: category,
                        rarity: rarity,
                        developer: details.developer || baseGame.developer || "Unknown",
                        score: Math.round((baseGame.positive / (baseGame.positive + baseGame.negative)) * 100),
                        reviews: baseGame.positive + baseGame.negative,
                        price: baseGame.price === "0" ? "Free" : `$${(baseGame.price / 100).toFixed(2)}`,
                        image: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${baseGame.appid}/header.jpg`,
                        backgroundImage: isSpecial ? `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${baseGame.appid}/library_hero.jpg` : null,
                        tags: tags.slice(0, 5)
                    };
                }
                return null;
            }));

            const validResults = results.filter(g => g !== null);
            if (validResults.length > 0) {
                finalGames.push(...validResults);
                fs.writeFileSync(OUTPUT_PATH, JSON.stringify(finalGames, null, 2));
            }

            console.log(`Progress: ${((finalGames.length / total) * 100).toFixed(2)}% | ${finalGames.length}/${total}`);
            await sleep(DELAY_MS);
        }

    } catch (error) {
        console.error("Critical Error:", error);
    }
}

runEnrichment(86); // max is 86