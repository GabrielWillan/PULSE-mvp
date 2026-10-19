import"./DashBoard.css"

const ActivityIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 12h4l2.5-7 5 14L17 12h4" />
  </svg>
);

const MenuIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M4 5h16"/>
    <path d="M4 12h16"/>
    <path d="M4 19h16"/>
  </svg>
);

const AddIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
   <path d="M5 12h14"/>
   <path d="M12 5v14"/>
  </svg>
);








export function DashBoard(){

  return(
    <div className="dashboard">
      <div className="dashboard-inner">
        <header className="dashboard-hdr">
          <div className="dashboard-left">
            <button className="dashboard-menu-btn"><MenuIcon /></button>
            <div className="dashboard-brand">
              <div className="dashboard-logo"><ActivityIcon /></div>
              <span className="logo-name">PULSE</span>
            </div>
          </div>
          <div className="dashboard-right">
            <div className="dashboard-date-overview">day-dd-mm</div>
            <button className="dashboard-add-exercise-btn"><AddIcon /></button>

          </div>
        </header>


      </div>
    </div>
  )
}