import PageMeta from "../../components/common/PageMeta";
import VerificationMetrics from "../../components/verification/VerificationMetrics";
import TicketStatusChart from "../../components/verification/TicketStatusChart";
import RecentActivity from "../../components/verification/RecentActivity";
import WeeklyChart from "../../components/verification/WeeklyChart";

export default function Home() {
  return (
    <>
      <PageMeta
        title="ARIES Verification Dashboard"
        description="Modern Warships Verification Admin Dashboard"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* Metrics Cards */}
        <div className="col-span-12">
          <VerificationMetrics />
        </div>

        {/* Charts Row */}
        <div className="col-span-12 xl:col-span-8">
          <WeeklyChart />
        </div>

        <div className="col-span-12 xl:col-span-4">
          <TicketStatusChart />
        </div>

        {/* Recent Activity */}
        <div className="col-span-12">
          <RecentActivity />
        </div>
      </div>
    </>
  );
}
