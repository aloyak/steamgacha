import fs from 'fs';

async function fetchPage(page) {
  const url = `https://steamspy.com/api.php?request=all&page=${page}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) return {};
    return await response.json();
  } catch (e) {
    console.error(`Failed to fetch page ${page}`);
    return {};
  }
}

async function fetchAllGames() {
  try {
    console.log("Fetching multiple pages from SteamSpy...");
    
    // Fetch pages 0 through 3 to get ~4,000 potential games
    const allPagesData = await Promise.all([
      fetchPage(0),
      fetchPage(1),
      fetchPage(2),
      fetchPage(3)
    ]);

    const gamesMap = new Map();
    allPagesData.forEach(pageData => {
      Object.values(pageData).forEach(game => {
        if (game.appid) gamesMap.set(game.appid, game);
      });
    });

    const gamesArray = Array.from(gamesMap.values());
    console.log(`Aggregated ${gamesArray.length} unique games. Processing...`);

    const processedGames = gamesArray
      .filter(game => (game.positive + game.negative) > 100 && game.name)
      .map(game => {
        const totalReviews = game.positive + game.negative;
        const score = (game.positive / totalReviews) * 100;
        const rawPrice = Number(game.price) || 0;
        const isFree = rawPrice === 0;
        
        // Prestige Score: Quality * Logarithmic Popularity
        // Using Log10 ensures quality matters even for niche titles
        const popularityWeight = Math.log10(totalReviews);
        const qualityWeight = score / 100;
        const prestigeScore = popularityWeight * qualityWeight * (isFree ? 0.9 : 1.0);

        return {
          id: game.appid,
          name: game.name,
          developer: typeof game.developer === 'string' ? game.developer.split(',')[0].trim() : 'Unknown',
          price: rawPrice / 100,
          score: Math.round(score),
          reviews: totalReviews,
          prestigeScore,
          isFree,
          image: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${game.appid}/header.jpg`
        };
      });

    // Sort by prestige to assign percentiles
    processedGames.sort((a, b) => b.prestigeScore - a.prestigeScore);

    const total = processedGames.length;
    const finalGames = processedGames.map((game, index) => {
      const percentile = (index / total) * 100;
      let rarity = "COMMON";

      // Adjusted percentiles for a larger 3,000+ pool
      if (percentile < 0.3) rarity = "CELESTIAL";
      else if (percentile < 2.0) rarity = "MYTHIC";
      else if (percentile < 6.0) rarity = "LEGENDARY";
      else if (percentile < 14.0) rarity = "EPIC";
      else if (percentile < 30.0) rarity = "RARE";
      else if (percentile < 60.0) rarity = "UNCOMMON";

      const { prestigeScore, ...cleanGame } = game;
      return { ...cleanGame, rarity };
    });

    fs.writeFileSync('./public/games.json', JSON.stringify(finalGames, null, 2));
    console.log(`Success! Saved ${finalGames.length} games to games.json`);

  } catch (error) {
    console.error("Error:", error.message);
  }
}

fetchAllGames();