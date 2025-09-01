export default function Loader() {
  return (
    <div className="loader-overlay" role="status" aria-live="polite" aria-label="Carregando">
      <div className="loader-circle-9">
        Loading
        <span></span>
      </div>
    </div>
  );
}
