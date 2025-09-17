// Test the complete weekly-to-daily feature
async function testCompleteFeature() {
  try {
    console.log("Testing complete weekly-to-daily feature...");
    
    // Test with markdown JSON response (like Gemini returns)
    const testResponse = `Break down this weekly task into specific daily tasks for today. Here are the tasks:

\`\`\`json
[
  {
    "title": "Review data schema documentation",
    "description": "Go through current data schema docs and identify gaps",
    "priority": "High",
    "target": 100,
    "weight": 35
  },
  {
    "title": "Test data validation scripts",
    "description": "Run existing validation scripts on sample data",
    "priority": "Medium", 
    "target": 100,
    "weight": 40
  },
  {
    "title": "Prepare sync meeting agenda",
    "description": "Create agenda for weekly ML team sync",
    "priority": "Medium",
    "target": 100,
    "weight": 25
  }
]
\`\`\``;

    // Test JSON parsing logic
    let jsonStr = testResponse;
    jsonStr = jsonStr.replace(/```json\s*/, '').replace(/```\s*$/, '');
    const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
    
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
      const tasks = JSON.parse(jsonStr);
      console.log("✅ JSON parsing successful!");
      console.log("Parsed tasks:", tasks);
      
      // Verify task structure
      const hasValidStructure = tasks.every(task => 
        task.title && task.description && task.priority && 
        typeof task.target === 'number' && typeof task.weight === 'number'
      );
      
      console.log("✅ Task structure validation:", hasValidStructure ? "PASSED" : "FAILED");
      
      // Check weights sum to 100
      const totalWeight = tasks.reduce((sum, task) => sum + task.weight, 0);
      console.log("✅ Weight validation:", totalWeight === 100 ? "PASSED" : `FAILED (total: ${totalWeight})`);
      
    } else {
      console.log("❌ JSON extraction failed");
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testCompleteFeature();