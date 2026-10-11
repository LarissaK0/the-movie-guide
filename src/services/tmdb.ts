
import type { PopularMoviesResponse, MovieDetails } from "../types/movie";

const API_URL = "https://api.themoviedb.org/3";

export async function getPopularMovies(
  page: number = 1
): Promise<PopularMoviesResponse> {
  const token = import.meta.env.VITE_TMDB_TOKEN;

  if (!token) {
    throw new Error(
      "Token do TMDB não configurado. Confira o arquivo .env.local."
    );
  }

  const response = await fetch(
    `${API_URL}/movie/popular?language=pt-BR&page=${page}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Erro ao buscar filmes: HTTP ${response.status}`
    );
  }

  const data: PopularMoviesResponse = await response.json();

  return data;
}

export async function searchMovies(
  query: string,
  page: number = 1
): Promise<PopularMoviesResponse> {
  const token = import.meta.env.VITE_TMDB_TOKEN;

  if (!token) {
    throw new Error(
      "Token do TMDB não configurado. Confira o arquivo .env.local."
    );
  }

  const response = await fetch(
    `${API_URL}/search/movie?query=${encodeURIComponent(query)}&language=pt-BR&page=${page}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Erro ao pesquisar filmes: HTTP ${response.status}`
    );
  }

  const data: PopularMoviesResponse = await response.json();

  return data;
}

export async function getMoviesByGenre(
  genreId: number,
  page: number = 1
): Promise<PopularMoviesResponse> {
  const token = import.meta.env.VITE_TMDB_TOKEN;

  if (!token) {
    throw new Error(
      "Token do TMDB não configurado. Confira o arquivo .env.local."
    );
  }

  const response = await fetch(
    `${API_URL}/discover/movie?with_genres=${genreId}&language=pt-BR&page=${page}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        accept: "application/json",
      },
    }
  );

  // Diagnóstico da requisição
  console.log("Status HTTP:", response.status);
  console.log("URL final:", response.url);

  if (!response.ok) {
    throw new Error(
      `Erro ao buscar filmes por gênero: HTTP ${response.status}`
    );
  }

  const data: PopularMoviesResponse = await response.json();

  // Diagnóstico dos resultados por gênero
  console.log("Gênero solicitado:", genreId);
  console.log("Total de páginas:", data.total_pages);
  console.log("Total de filmes:", data.total_results);

  console.table(
    data.results.slice(0, 5).map((movie) => ({
      id: movie.id,
      title: movie.title,
      genre_ids: JSON.stringify(movie.genre_ids),
      contemGeneroSolicitado: movie.genre_ids?.includes(genreId),
    }))
  );

  return data;
}

export async function getMovieDetails(
  movieId: number
): Promise<MovieDetails> {
  const token = import.meta.env.VITE_TMDB_TOKEN;

  if (!token) {
    throw new Error(
      "Token do TMDB não configurado. Confira o arquivo .env.local."
    );
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    accept: "application/json",
  };

  const [detailsResponse, creditsResponse] = await Promise.all([
    fetch(
      `${API_URL}/movie/${movieId}?language=pt-BR`,
      { headers }
    ),
    fetch(
      `${API_URL}/movie/${movieId}/credits?language=pt-BR`,
      { headers }
    ),
  ]);

  if (!detailsResponse.ok || !creditsResponse.ok) {
    throw new Error(
      "Não foi possível carregar os detalhes do filme."
    );
  }

  const details = await detailsResponse.json();
  const credits = await creditsResponse.json();

  return {
    ...details,
    credits,
  } as MovieDetails;
}
