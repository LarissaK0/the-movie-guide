import Pagination from "@mui/material/Pagination";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { Link } from "react-router-dom";
import "./App.css";
import {
  getPopularMovies,
  searchMovies,
  getMoviesByGenre,
} from "./services/tmdb";
import type { Movie, PopularMoviesResponse } from "./types/movie";

const genres = [
  { id: 28, name: "Ação" },
  { id: 12, name: "Aventura" },
  { id: 16, name: "Animação" },
  { id: 35, name: "Comédia" },
  { id: 80, name: "Crime" },
  { id: 18, name: "Drama" },
  { id: 14, name: "Fantasia" },
  { id: 27, name: "Terror" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Ficção científica" },
  { id: 53, name: "Suspense" },
];

function App() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);

  const requestIdRef = useRef(0);

  const loadCatalog = useCallback(
    async (
      targetPage: number,
      searchTerm: string,
      genreId: number | null
    ) => {
      const requestId = ++requestIdRef.current;

      try {
        setLoading(true);
        setError("");

     let displayedHasNextPage = false;

    if (searchTerm.trim() && genreId !== null) {
         const matchingMovies: Movie[] = [];
         let apiPage = 1;
         let apiTotalPages = 1;

         const neededMovies = targetPage * 20 + 1;

         while (
            matchingMovies.length < neededMovies &&
            apiPage <= apiTotalPages
          ) {
            const data = await searchMovies(
              searchTerm.trim(),
              apiPage
            );

            if (requestId !== requestIdRef.current) {
              return;
            }

            apiTotalPages = data.total_pages;

            matchingMovies.push(
              ...data.results.filter((movie) =>
                movie.genre_ids?.includes(genreId)
              )
            );

            apiPage++;
          }

          const startIndex = (targetPage - 1) * 20;

          const currentMovies = matchingMovies.slice(
            startIndex,
            startIndex + 20
          );

          setMovies(currentMovies);
          setTotalPages(
  Math.max(targetPage, Math.ceil(matchingMovies.length / 20))
);
          displayedHasNextPage =
            matchingMovies.length > targetPage * 20;
        } else {
          let data: PopularMoviesResponse;

          if (searchTerm.trim()) {
            data = await searchMovies(
              searchTerm.trim(),
              targetPage
            );
          } else if (genreId !== null) {
            data = await getMoviesByGenre(genreId, targetPage);

            console.log("Gênero selecionado:", genreId);
            console.log("Total de páginas retornado pela API:", data.total_pages);
            console.log("Total de filmes retornado pela API:", data.total_results);
          } else {
            data = await getPopularMovies(targetPage);
          }

          if (requestId !== requestIdRef.current) {
            return;
          }

          setMovies(data.results);

setTotalPages(
  Math.min(Math.max(data.total_pages, 1), 500)
);

          if (genreId !== null && !searchTerm.trim()) {
            displayedHasNextPage = data.results.length === 20;
          } else {
            displayedHasNextPage =
  targetPage < Math.min(data.total_pages, 500);
          }
        }

        if (requestId !== requestIdRef.current) {
          return;
        }

        setPage(targetPage);
        setHasNextPage(displayedHasNextPage);
      } catch (err) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar os filmes."
        );

        setMovies([]);
        setHasNextPage(false);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    const searchTerm = query.trim();

    setHasSearched(Boolean(searchTerm));

    const timeoutId = setTimeout(() => {
      void loadCatalog(1, searchTerm, selectedGenre);
    }, 400);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [query, selectedGenre, loadCatalog]);

  async function handlePageChange(newPage: number) {
    if (
      newPage < 1 ||
      (newPage > page && !hasNextPage) ||
      loading
    ) {
      return;
    }

    await loadCatalog(newPage, query.trim(), selectedGenre);
  }

  function handleSelectGenre(genreId: number | null) {
    setSelectedGenre(genreId);
  }

  function handleLogoClick(
    event: MouseEvent<HTMLAnchorElement>
  ) {
    event.preventDefault();
    setQuery("");
    setSelectedGenre(null);
    setHasSearched(false);
    setError("");
  }

  const selectedGenreName = genres.find(
    (genre) => genre.id === selectedGenre
  )?.name;

  return (
    <main className="app">
    <header className="header">
<img
  src={`${import.meta.env.BASE_URL}icon.png`}
  alt="Logo The Movie Guide"
  className="icon"
/>

   <a
     className="logo"
     href="/"
     onClick={handleLogoClick}
    >
    The Movie Guide<span>.</span>
     </a>
    <div className="watermark">
      Feito com ♥ by Larissa <span>.</span>
      </div>
        <form
          className="search-form"
          onSubmit={(event) => event.preventDefault()}
        >
          <input
            className="search"
            type="text"
            placeholder="Buscar filmes..."
            aria-label="Buscar filmes"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </form>
      </header>

      <section className="catalog">
           <div className="genre-intro">
      <h2 className="genre-title">
    Explore filmes por gênero.
    </h2>

    <p className="genre-subtitle">
    Qual será sua próxima história?
   </p>
    </div>
        <div className="genre-filters">
          <button
            className={
              selectedGenre === null
                ? "genre-button active"
                : "genre-button"
            }
            type="button"
            onClick={() => handleSelectGenre(null)}
          >
            Todos
          </button>

          {genres.map((genre) => (
            <button
              key={genre.id}
              className={
                selectedGenre === genre.id
                  ? "genre-button active"
                  : "genre-button"
              }
              type="button"
              onClick={() => handleSelectGenre(genre.id)}
            >
              {genre.name}
            </button>
          ))}
        </div>

        <div className="catalog-heading">
          <div>
            <p className="eyebrow">O CINEMA DO SEU JEITO</p>

            <h1>
              {hasSearched
                ? `Resultados para "${query.trim()}"`
                : selectedGenreName ?? "Filmes populares"}
            </h1>
          </div>

          <span className="movie-count">
            {movies.length} filmes
          </span>
        </div>

        {loading && (
          <p className="status-message">
            Carregando filmes...
          </p>
        )}

        {!loading && error && (
          <p className="status-message error-message">
            {error}
          </p>
        )}

        {!loading && !error && movies.length === 0 && (
          <p className="status-message">
            Nenhum filme encontrado. Tente pesquisar outro título.
          </p>
        )}

        {!loading && !error && movies.length > 0 && (
     <div className="movie-grid">
       {movies.map((movie) => (
       <article className="movie-card" key={movie.id}>
       <Link
          to={`/filme/${movie.id}`}
        className="movie-card-link"
        aria-label={`Ver detalhes do filme ${movie.title}`}
         >
      {movie.poster_path ? (
         <img
         className="movie-poster"
         src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
        alt={`Pôster do filme ${movie.title}`}
        loading="lazy"
        />
         ) : (
        <div className="movie-poster poster-placeholder">
         Pôster indisponível
         </div>
        )}

       <div className="movie-info">
       <h2>{movie.title}</h2>

       <div className="movie-details">
       <span>
       {movie.release_date
      ? movie.release_date.slice(0, 4)
       : "Ano desconhecido"}
      </span>

      <span className="rating">
      ★ {movie.vote_average.toFixed(1)}
      </span>
      </div>
      </div>
      </Link>
     </article>
     ))}
    </div>
       )}

{!loading && !error && (page > 1 || hasNextPage) && (
  <nav
    className="pagination"
    aria-label="Paginação dos filmes"
  >
    <Pagination
      count={totalPages}
      page={page}
      onChange={(_, value) => {
        void handlePageChange(value);
      }}
      disabled={loading}
      shape="rounded"
      variant="outlined"
      size="large"
      showFirstButton
      showLastButton
      siblingCount={1}
      boundaryCount={1}
      
sx={{
  "& .MuiPaginationItem-root": {
    color: "#ffffff",
    borderColor: "#383838",
    backgroundColor: "#1a0101",
    borderRadius: "30%",
    minWidth: "30px",
    height: "30px",
    transition: "all 0.25s ease",
  },

  "& .MuiPaginationItem-root:hover": {
    backgroundColor: "#360808",
    borderColor: "#00e054",
  },

  "& .MuiPaginationItem-root.Mui-selected": {
    backgroundColor: "#00e054",
    color: "#0b0b0b",
    borderColor: "#00e054",
    fontWeight: 600,
  },

  "& .MuiPaginationItem-root.Mui-selected:hover": {
    backgroundColor: "#00c94a",
  },

  "& .MuiPaginationItem-root.Mui-disabled": {
    color: "#666666",
    borderColor: "#383434",
    
  },
  

}}

    />
  </nav>
)}
     </section>
    </main>
  );
}

export default App;
