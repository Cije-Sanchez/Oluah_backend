const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const cors = require("cors");
app.use(express.text());

app.use(cors());
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

/*Incase you want to use a vector database*/
// async function Vectorizer() {
//   try {
//     await pool.query(
//       `
//       SELECT ai.create_vectorizer(
//       'public.imdb_numbered_votes'::regclass,
//       embedding=>ai.embedding_openai('text-embedding-3-small', 1536, api_key_name=>'OPENAI_API_KEY'),
//       chunking=>ai.chunking_recursive_character_text_splitter('description'),
//       formatting=>ai.formatting_python_template('title: $title description: $chunk, year: $year, duration: $duration, rating: $rating, stars: $stars')
//       );
//       `,
//     );
//     return { status: "success" };
//   } catch (error) {
//     console.log(error);
//     return { status: "failed" };
//   }
// }

/*Also incase you want to use a vector database*/
// async function EmbedQuery(query) {
//   try {
//     // Step 1: Get the embedding for the query
//     const embeddingResult = await pool.query(
//       `SELECT ai.openai_embed('text-embedding-3-small', $1) AS embedding`,
//       [query],
//     );
//
//     const embedding = embeddingResult.rows[0].embedding;
//
//     // Step 2: Use the embedding in the main query
//     const result = await pool.query(
//       `
//     SELECT chunk
//     FROM imdb_numbered_votes_embedding_store
//     ORDER BY embedding <=> $1
//     LIMIT 3;
//     `,
//       [embedding],
//     );
//
//     const rows = result.rows;
//     const context = rows.map((value) => `Chunk: ${value.chunk}`).join("\n\n");
//
//     return { status: "success", chunk: context };
//   } catch (error) {
//     console.log(error);
//     return { status: "failed" };
//   }
// }

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
  res.send(req.body);
  res.send(req.body);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
