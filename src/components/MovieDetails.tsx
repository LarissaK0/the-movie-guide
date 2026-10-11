
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getMovieDetails } from "../services/tmdb";
import type { MovieDetails as MovieDetailsType } from "../types/movie";

export default function MovieDetails() {
  const { id } = useParams<{ id: string }>();

  const [movie, setMovie] = useState<MovieDetailsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
      setError("O identificador deste filme é inválido.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadMovie() {
      try {
        setLoading(true);
        setError("");

        const data = await getMovieDetails(Number(id));

        if (!cancelled) {
          setMovie(data);
        }
      } catch {
        if (!cancelled) {
          setError("Não foi possível carregar os detalhes do filme.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadMovie();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <main className="details-status">Carregando detalhes do filme...</main>;
  }

  if (error || !movie) {
    return (
      <main className="details-status">
        <p>{error || "Filme não encontrado."}</p>
        <Link to="/" className="back-link">
          Voltar ao catálogo
        </Link>
      </main>
    );
  }

  const director = movie.credits.crew.find(
    (person) => person.job === "Director"
  );

  const backdrop = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
    : null;

  const poster = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : null;

  return (
    <main className="details-page">
      <section
        className="details-hero"
        style={
          backdrop
            ? { backgroundImage: `url("${backdrop}")` }
            : undefined
        }
      >
        <div className="details-overlay">
          <Link to="/" className="back-link">
            ← Voltar ao catálogo
          </Link>

          <div className="details-main">
            {poster ? (
              <img
                className="details-poster"
                src={poster}
                alt={`Pôster de ${movie.title}`}
              />
            ) : (
              <div className="details-poster poster-placeholder">
                Pôster indisponível
              </div>
            )}

            <div className="details-summary">
              <h1>{movie.title}</h1>

              {movie.release_date && (
                <p>
                  Lançamento:{" "}
                  {new Date(
                    `${movie.release_date}T12:00:00`
                  ).toLocaleDateString("pt-BR")}
                </p>
              )}

              <p>
                ⭐ {movie.vote_average.toFixed(1)} / 10
                {" · "}
                {movie.vote_count.toLocaleString("pt-BR")} votos
              </p>

              {movie.runtime !== null && movie.runtime > 0 && (
                <p>
                  Duração: {Math.floor(movie.runtime / 60)}h{" "}
                  {movie.runtime % 60}min
                </p>
              )}

              <div className="details-genres">
                {movie.genres.map((genre) => (
                  <span key={genre.id}>{genre.name}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="details-content">
        <h2>Sinopse</h2>
        <p>
          {movie.overview || "Sinopse não disponível para este filme."}
        </p>

        {director && (
          <div className="details-director">
            <h2>Direção</h2>
            <p>{director.name}</p>
          </div>
        )}

        <div className="details-cast">
          <h2>Elenco principal</h2>

          <div className="cast-grid">
            {movie.credits.cast.slice(0, 10).map((person) => (
              <article className="cast-card" key={person.id}>
                {person.profile_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
                    alt={person.name}
                    loading="lazy"
                  />
                ) : (
                  <div className="cast-placeholder">
                    Sem foto
                  </div>
                )}

                <h3>{person.name}</h3>
                <p>{person.character || "Personagem não informado"}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
