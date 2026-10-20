import"./DashBoard.css"
import { useEffect, useState } from "react";

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



function useToday(){
  const[today, setToday] = useState(()=> new Date());

  useEffect(()=>{
    const now = new Date()
    const nextMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );
        const id = setTimeout(
      () => setToday(new Date()),
      nextMidnight - now + 1000
    );
    return () => clearTimeout(id);
  }, [today]);
  return today
}


function currentToday(date){
  const weekday = date.toLocaleDateString("en-GB",{
    weekday: "long",
  });


  const dayMonth = date.toLocaleDateString("en-GB",{
    day:"numeric",
    month:"long",
  });

  const pad = (n) => String(n).padStart(2, "0");

  return {
    label: `${weekday}, ${dayMonth}`,
    iso: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )}`,
  };
}




function titleShowCase(){
  const hour = new Date().getHours();
  if (hour < 12){
    return "Good morning"
  } else if (hour < 18){
    return "Good afternoon";
  }else{
    return "Good evening";
  }

  
}

export function DashBoard(){
  const today = useToday();
  const {label, iso} = currentToday(today);
  const titleMessage = titleShowCase()

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
            <time className="dashboard-date-ovw" dateTime={iso}>
              <span className="dashboard-date-format">
                {label}
              </span>
            </time>
            <button className="dashboard-add-exercise-btn"><AddIcon /></button>

          </div>
        </header>

        <main className="dashboard-main">
          <div className="dashboard-titles-container">
            <div className="dashboard-sub-top">
              <span>YOUR   TRAINING   CALENDAR</span>
            </div>
            <div className="dashboard-title">
              <h1>{titleMessage}</h1>
            </div>
            <div className="dashboard-sub-low">
              <span>A quick look at your week and what's next.</span>
            </div>

          </div>
        </main>


      </div>
    </div>
  )
}