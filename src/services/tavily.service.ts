import axios from "axios";
import type { Document } from "langchain/document";

const TAVILY_API_KEY = Bun.env.TAVILY_API_KEY;

 const searchWeb = async (query: string) => {
    try {
      const { data } = await axios.post('https://api.tavily.com/search', {
        query: query,
        search_depth: "advanced",     
        include_answer: "advanced",
        include_domains: [],
        exclude_domains: [],
        max_results: 3,
        api_key: TAVILY_API_KEY
      });
      
      if (data?.results?.length === 0) {
        return null;
      }
      
      const content = data.results.map((result: any) => result.content).join("\n\n---\n\n");
      
      return { 
        pageContent: content, 
        metadata: { source: "web_search" } 
      } as Document;
    } catch (err) {
      return null;
    }
}

export default searchWeb