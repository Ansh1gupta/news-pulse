export default function SourceFilter({ allSources, selectedSources, onToggle }) {
  return (
    <div className="source-filter">
      <span className="source-filter-label">Sources:</span>
      {allSources.map((source) => (
        <label key={source} className="source-checkbox">
          <input
            type="checkbox"
            checked={selectedSources.has(source)}
            onChange={() => onToggle(source)}
          />
          {source}
        </label>
      ))}
    </div>
  );
}
