import"./DashBoard.css"

export function DashBoard(){

  return(
    <div className="dashboard">
      <div className="dashboard-inner">
        <header className="dashboard-hdr">
          <div className="dashboard-right">
            <button className="dashboard-menu-btn">menu</button>
            <div className="dashboard-brand">
              <div className="dashboard-logo">logo</div>
              <span className="logo-name">PULSE</span>
            </div>
          </div>
          <div className="dashboard-left">
            <div className="date-overview">day-dd-mm</div>
            <button className="add-exercise-btn">+</button>

          </div>
        </header>


      </div>
    </div>
  )
}