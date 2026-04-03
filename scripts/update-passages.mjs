#!/usr/bin/env node
// Update passage for all reading quizzes that have stories in wechat history
import { readFileSync } from 'fs';
import { execSync } from 'child_process';

const stories = JSON.parse(readFileSync('/tmp/stories.json', 'utf8'));

// Map date -> quiz id (from DB query)
// We need to get quiz IDs first
async function main() {
  // Get all reading quiz IDs
  const result = execSync(
    `cd ~/Workspaces/gongzu && npx wrangler d1 execute gongzu --remote --json --command "SELECT id, date FROM daily_quizzes WHERE tag = '阅读理解' AND (passage IS NULL OR passage = '') ORDER BY date"`,
    { encoding: 'utf8', timeout: 30000 }
  );
  
  const parsed = JSON.parse(result.trim());
  const quizzes = parsed[0].results;
  
  for (const quiz of quizzes) {
    const story = stories[quiz.date];
    if (!story) {
      console.log(`⏭️ ${quiz.date}: no story found`);
      continue;
    }
    
    const escaped = story.replace(/'/g, "''");
    const sql = `UPDATE daily_quizzes SET passage = '${escaped}' WHERE id = '${quiz.id}'`;
    
    try {
      execSync(
        `cd ~/Workspaces/gongzu && npx wrangler d1 execute gongzu --remote --command "${sql.replace(/"/g, '\\"')}"`,
        { encoding: 'utf8', timeout: 15000 }
      );
      console.log(`✅ ${quiz.date}: updated (${story.length} chars)`);
    } catch (e) {
      // Write to file and use --file instead
      const tmpFile = `/tmp/passage-${quiz.date}.sql`;
      require('fs').writeFileSync(tmpFile, sql);
      try {
        execSync(
          `cd ~/Workspaces/gongzu && npx wrangler d1 execute gongzu --remote --file ${tmpFile}`,
          { encoding: 'utf8', timeout: 15000 }
        );
        console.log(`✅ ${quiz.date}: updated via file (${story.length} chars)`);
      } catch (e2) {
        console.error(`❌ ${quiz.date}: ${e2.message.slice(0, 100)}`);
      }
    }
  }
}

main().catch(console.error);
