import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { ChatBot } from "../chat/ChatBot";

export function MainLayout() {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1">
        <Outlet />
      </div>
      <ChatBot />
    </div>
  );
}
