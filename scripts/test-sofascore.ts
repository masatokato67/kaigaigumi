/**
 * SofaScore 非公式API テストスクリプト
 *
 * 使用方法: npx tsx scripts/test-sofascore.ts
 */

// 三笘薫のSofaScore Player ID
const MITOMA_SOFASCORE_ID = 936849;

async function testSofaScoreAPI() {
  console.log("=== SofaScore API テスト ===\n");

  const headers = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Accept": "application/json",
  };

  // 1. 選手情報を取得
  console.log("1. 選手情報を取得中...");
  try {
    const playerRes = await fetch(
      `https://api.sofascore.com/api/v1/player/${MITOMA_SOFASCORE_ID}`,
      { headers }
    );

    if (!playerRes.ok) {
      console.log(`   ❌ エラー: ${playerRes.status} ${playerRes.statusText}`);
    } else {
      const playerData = await playerRes.json();
      console.log(`   ✅ 選手名: ${playerData.player?.name}`);
      console.log(`   ✅ チーム: ${playerData.player?.team?.name}`);
    }
  } catch (err) {
    console.log(`   ❌ エラー: ${err}`);
  }

  // 2. 選手の最近の試合を取得
  console.log("\n2. 最近の試合を取得中...");
  try {
    const eventsRes = await fetch(
      `https://api.sofascore.com/api/v1/player/${MITOMA_SOFASCORE_ID}/events/last/0`,
      { headers }
    );

    if (!eventsRes.ok) {
      console.log(`   ❌ エラー: ${eventsRes.status} ${eventsRes.statusText}`);
    } else {
      const eventsData = await eventsRes.json();
      const events = eventsData.events || [];
      console.log(`   ✅ 試合数: ${events.length}件`);

      if (events.length > 0) {
        console.log("\n   最近の5試合:");
        events.slice(0, 5).forEach((event: any, i: number) => {
          const date = new Date(event.startTimestamp * 1000).toISOString().split("T")[0];
          console.log(`   ${i + 1}. ${date}: ${event.homeTeam?.name} vs ${event.awayTeam?.name}`);
        });
      }
    }
  } catch (err) {
    console.log(`   ❌ エラー: ${err}`);
  }

  // 3. 特定試合の選手統計を取得（最新試合）
  console.log("\n3. 試合統計を取得中...");
  try {
    const eventsRes = await fetch(
      `https://api.sofascore.com/api/v1/player/${MITOMA_SOFASCORE_ID}/events/last/0`,
      { headers }
    );

    if (eventsRes.ok) {
      const eventsData = await eventsRes.json();
      const latestEvent = eventsData.events?.[0];

      if (latestEvent) {
        const eventId = latestEvent.id;
        console.log(`   試合ID: ${eventId}`);

        // 選手の試合統計を取得
        const statsRes = await fetch(
          `https://api.sofascore.com/api/v1/event/${eventId}/player/${MITOMA_SOFASCORE_ID}/statistics`,
          { headers }
        );

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          console.log(`   ✅ 統計データ取得成功`);

          const stats = statsData.statistics;
          if (stats) {
            console.log(`   - 出場時間: ${stats.minutesPlayed || "N/A"}分`);
            console.log(`   - ゴール: ${stats.goals || 0}`);
            console.log(`   - アシスト: ${stats.assists || 0}`);
            console.log(`   - 評価: ${stats.rating || "N/A"}`);
          }
        } else {
          console.log(`   ❌ 統計エラー: ${statsRes.status}`);
        }
      }
    }
  } catch (err) {
    console.log(`   ❌ エラー: ${err}`);
  }

  console.log("\n=== テスト完了 ===");
}

testSofaScoreAPI();
