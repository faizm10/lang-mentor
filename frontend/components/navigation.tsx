"use client";

export default function Navigation() {
  return (
    <nav className="flex-1 flex items-center justify-between">
      <div className="flex items-center">
        <h1 className="text-xl font-bold text-primary font-sans">
          MentorMatch
        </h1>
      </div>

      {/* <div className="flex items-center gap-1 sm:gap-2">
        <Button
          variant={currentView === "mentor" ? "default" : "outline"}
          size="sm"
          className={cn(
            "text-sm font-medium transition-all duration-200",
            currentView === "mentor"
              ? "bg-accent hover:bg-accent/90"
              : "text-primary hover:bg-secondary"
          )}
          onClick={() => onViewChange("mentor")}
        >
          Mentor Selection
        </Button>
        <Button
          variant={currentView === "admin" ? "default" : "outline"}
          size="sm"
          className={cn(
            "text-sm font-medium transition-all duration-200",
            currentView === "admin"
              ? "bg-accent hover:bg-accent/90"
              : "text-primary hover:bg-secondary"
          )}
          onClick={() => onViewChange("admin")}
        >
          Admin Dashboard
        </Button>
      </div> */}
    </nav>
  );
}
