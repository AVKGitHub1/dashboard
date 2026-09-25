import DashboardGrid from '../components/layout/DashboardGrid';
import Sidebar from '../components/layout/Sidebar';
import TopBar from '../components/layout/TopBar';

export default function DashboardPage() {
  return (
    <div className="app-shell flex flex-col">
      <TopBar />
      {/* overscroll-contain stops a flick that runs off the end of the grid from
          chaining into the browser's own pull-to-refresh. */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
        <DashboardGrid />
      </div>
      <Sidebar />
    </div>
  );
}
