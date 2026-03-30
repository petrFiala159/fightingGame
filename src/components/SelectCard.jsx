export default function SelectCard({ fighter, selected, accentClass, onSelect }) {
  return (
    <button type="button" className={`card ${selected ? accentClass : ""}`} onClick={onSelect}>
      <img src={fighter.img} alt={fighter.name} draggable="false" />
      <h3 style={{ color: fighter.color }}>{fighter.name}</h3>
      <p>{fighter.passive}</p>
    </button>
  );
}
