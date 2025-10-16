# How to run 
'''js
git clone <this project>  
cd <this project>
npm install 
npm run dev

// open localhost:3000
''' 


# Progress 

see devlog/devlog.md for guideline


========================== Overview ============================
# Tech stack (Technology used) 

- Next.js for frontend and backend 
- Langgraph.js for interacting and tuning LLM 
- Supabase for database

# Features 

### Core features  

0. Authentication 
1. Prompt -> A website (either in React.js or static HTML CSS) 
2. Filesystem for holding the generated code  
3. Live preview 
4. Live editing


# Implementation

0. Authentication  
  -> Use supabase standard (email password)  or OAuth (Gmail, facebook) or Passwordless (click email to sign in) 
1. Filesystem for holding the generated code  
  -> Map the user to the object storage in supabase and render
2. Prompt -> A website (either in React.js or static HTML CSS)   
  -> Connect from frontend to API with Langgraph
3. Live preview  
  -> Should be easy if Filesystem is setup
4. Live editing 
  -> React DOM to index structure and can select to prompt 

