import { Document } from "@langchain/core/documents";
import initLLM from "../config/llm.config";

const semanticChunkDocuments = async (documents, maxChunks) => {
  try {
    const llm = initLLM();
    const processedDocs = [];

    for (const doc of documents) {
      if (doc.pageContent.length < 500) {
        processedDocs.push(doc);
        continue;
      }

      const chunksPrompt = `
      Hãy phân chia văn bản sau đây thành tối đa ${maxChunks} đoạn nhỏ, mỗi đoạn có ý nghĩa hoàn chỉnh và liên quan đến nhau.
      Mỗi đoạn cần chứa thông tin có ý nghĩa ngữ nghĩa độc lập để có thể truy vấn riêng biệt.
      Format kết quả: Chỉ trả về các đoạn đã phân chia, mỗi đoạn cách nhau bởi dấu ---CHUNK_SEPARATOR---.
      
      Văn bản:
      ${doc.pageContent}
      `;

      const result = await llm.invoke(chunksPrompt);
      
      const chunks = result.split('---CHUNK_SEPARATOR---')
        .map(chunk => chunk.trim())
        .filter(chunk => chunk.length > 0);
      
      chunks.forEach(chunkContent => {
        processedDocs.push(
          new Document({
            pageContent: chunkContent,
            metadata: { ...doc.metadata }
          })
        );
      });
    }
    
    return processedDocs;
  } catch (err) {
    return documents;
  }
};

const semanticChunkMovieDocuments = async (movieDocuments) => {
  return semanticChunkDocuments(movieDocuments, 1);
};

export {
  semanticChunkDocuments,
  semanticChunkMovieDocuments
};
