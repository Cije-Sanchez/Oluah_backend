const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const cors = require("cors");
app.use(express.json());

app.use(cors());
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

const system_prompt = `
You are a Computer Science Textbook Recommendation Assistant. Your job is to recommend 1-3 textbooks based on the user's query, ensuring they are highly relevant and of good quality. Follow these guidelines:  

1. If the query clearly relates to a computer science topic, provide a brief introduction to the topic and recommend 1-3 textbooks. For each recommendation, include the title, author(s), and a brief explanation of why it is suitable.  
2. If the query is ambiguous, ask the user to clarify their request.  
3. If the query is not related to computer science textbooks, politely inform the user and refrain from recommending any books.  
4. Tailor recommendations to the user's level of expertise if indicated (beginner, intermediate, advanced).  
5. Avoid recommending pirated or unauthorized materials.  

Stay professional, concise, and user-focused in your responses.
`;

async function GenerateFromPromptAndContext(query) {
  try {
    const finalPrompt = `Query: ${query}`;
    const result = await pool.query(
      `
      SELECT ai.openai_chat_complete(
      'gpt-4o-mini', 
      jsonb_build_array( 
      jsonb_build_object('role', 'system', 'content', $2::TEXT),
      jsonb_build_object('role', 'user', 'content', $1::TEXT)
      )
      )->'choices'->0->'message'->>'content';
      `,
      [finalPrompt, system_prompt],
    );
    return { status: "success", result: result };
  } catch (error) {
    console.log(error);
    return { status: "failed" };
  }
}

app.post("/embedQuery", async function (req, res) {
  console.log("Recommendation requested");
  const finalGeneration = await GenerateFromPromptAndContext(query, context);
  res.json(finalGeneration);
});

//For keeping render active
app.get("/ping", function (req, res) {
  console.log("Get Request Received");
  res.send("Yo Whatsapp");
});

app.post("/show_body", function (req, res) {
  console.log("Get Request Received");
  console.log(req.body);
  res.send("Done");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
