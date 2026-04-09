import fs from 'fs';

async function fetchAllGames() {
  console.log("Downloading full Steam catalog (this may take 30-60 seconds)...");
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

    const response = await fetch('https://steamspy.com/api.php?request=all', {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`Server responded with ${response.status}`);
    
    const data = await response.json();
    const gamesArray = Object.values(data);
    console.log(`Received ${gamesArray.length} games. Processing...`);

    const processedGames = gamesArray
      .filter(game => (game.positive + game.negative) > 500) // Filter out tiny/empty games
      .map(game => {
        const totalReviews = game.positive + game.negative;
        const score = Math.round((game.positive / totalReviews) * 100);
        
        const isFree = game.price === "0" || game.price === 0;
        const weightedReviews = isFree ? totalReviews * 0.5 : totalReviews;

        let rarity = "COMMON";
        // Thresholds adjusted for the "All" catalog
        if (score >= 95 && weightedReviews > 100000) rarity = "LEGENDARY";
        else if (score >= 90 && weightedReviews > 30000) rarity = "EPIC";
        else if (score >= 80 && weightedReviews > 5000) rarity = "RARE";

        return {
          id: game.appid,
          name: game.name,
          score,
          reviews: totalReviews,
          rarity,
          isFree,
          image: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${game.appid}/header.jpg`
        };
      });

    fs.writeFileSync('./public/games.json', JSON.stringify(processedGames, null, 2));
    console.log(`Success! Saved ${processedGames.length} quality games to games.json`);

  } catch (error) {
    if (error.name === 'AbortError') {
      console.error("The request took too long and was aborted. SteamSpy is struggling.");
    } else {
      console.error("Error:", error.message);
    }
  }
}

fetchAllGames();