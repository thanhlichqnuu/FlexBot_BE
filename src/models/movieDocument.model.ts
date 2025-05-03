interface MovieDocument {
  pageContent: string;
  metadata: {
    name: string;
    origin_name: string;
    description: string;
    release_year: number;
    status: string;
    director: string;
    actor: string;
    duration: string;
    episode_total: string
    country: string;
    genres: string;
  };
}

export type { MovieDocument as default };
