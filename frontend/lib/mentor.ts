interface LangStudent {
  id: string;
  name: string;
  major: string;
  minor?: string;
  year: "3rd Year" | "4th Year";
  hobbies: string[];
  bio: string;
  avatar: string;
}

export const langStudentsData: LangStudent[] = [
  {
    id: "1",
    name: "Sarah Chen",
    major: "Marketing Management",
    minor: "Project Management",
    year: "4th Year",
    hobbies: ["Photography", "Brand Strategy", "Student Leadership"],
    bio: "Creative marketer passionate about storytelling and brand identity. VP of the Marketing Society and currently working on a capstone campaign for a local nonprofit.",
    avatar: "SC",
  },
  {
    id: "2",
    name: "Marcus Rodriguez",
    major: "Management Economics and Finance",
    minor: "Entrepreneurship",
    year: "3rd Year",
    hobbies: ["Stock Trading", "Pitch Competitions", "Reading Tech News"],
    bio: "Finance student with an entrepreneurial spirit. Built a budgeting app with friends and is now working on a startup idea for student investing.",
    avatar: "MR",
  },
  {
    id: "3",
    name: "Priya Patel",
    major: "Accounting",
    minor: "Business Data Analytics",
    year: "4th Year",
    hobbies: ["Excel Modeling", "Volunteering", "Cooking"],
    bio: "Future CPA passionate about data-driven decision making. Has interned with a Big 4 firm and mentors first-year accounting students.",
    avatar: "PP",
  },
  {
    id: "4",
    name: "David Kim",
    major: "Hospitality and Tourism Management",
    minor: "International Business",
    year: "4th Year",
    hobbies: ["Event Planning", "Travel Blogging", "Cafés"],
    bio: "Hospitality enthusiast with a love for curating experiences. Organized campus-wide events and dreams of opening his own boutique hotel.",
    avatar: "DK",
  },
  {
    id: "5",
    name: "Emma Thompson",
    major: "Sport and Event Management",
    minor: "Sustainable Business",
    year: "3rd Year",
    hobbies: ["Soccer", "Campus Rec", "Planning Tournaments"],
    bio: "Driven event planner who combines sustainability with sport. Coordinates intramurals and is involved with UofG’s athletics marketing team.",
    avatar: "ET",
  },
  {
    id: "6",
    name: "James Wilson",
    major: "Real Estate",
    minor: "Economics",
    year: "4th Year",
    hobbies: ["Real Estate Trends", "Running", "Urban Design"],
    bio: "Aspiring property developer exploring commercial real estate markets. Completed a summer co-op in leasing and investment analysis.",
    avatar: "JW",
  },
  {
    id: "7",
    name: "Lisa Anderson",
    major: "Management",
    minor: "Human Resources",
    year: "4th Year",
    hobbies: ["Team Building", "Coffee Chats", "LinkedIn Networking"],
    bio: "People-first leader focused on organizational development. Active in Lang’s mentorship program and aiming for a career in talent management.",
    avatar: "LA",
  },
  {
    id: "8",
    name: "Ahmed Hassan",
    major: "Food and Agricultural Business",
    minor: "Sustainable Business",
    year: "3rd Year",
    hobbies: ["AgTech", "Farmers' Markets", "Sustainability"],
    bio: "Business meets agriculture — passionate about food systems and innovation. Volunteered with OAC and worked on a farm-to-table business model.",
    avatar: "AH",
  },
];
