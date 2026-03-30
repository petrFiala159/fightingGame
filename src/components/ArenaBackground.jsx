import warehouseBg from "../assets/warehouse-bg.png";

export default function ArenaBackground() {
  return (
    <>
      <div className="arena-bg" style={{ backgroundImage: `url(${warehouseBg})` }} />
      <div className="arena-overlay" />
      <div className="arena-grid" />
      <div className="arena-logo">MALFINI</div>
      <div className="floorGlow" />
      <div className="floorLabel">MALFINI WAREHOUSE FIGHT</div>
      <div className="floor" />
    </>
  );
}
