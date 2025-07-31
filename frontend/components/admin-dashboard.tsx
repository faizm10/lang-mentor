"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
// import { toast } from "@/components/ui/use-toast"
import { Search, CheckCircle, Clock, X, Edit, Trash2 } from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  selections: string[]
  submissionDate: string
  status: "Pending" | "Assigned"
}

interface Assignment {
  id: string
  menteeName: string
  menteeEmail: string
  mentorName: string
  assignmentDate: string
  status: "Pending" | "Active" | "Completed"
  notes?: string
}

const sampleUsers: User[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    selections: ["Dr. Emily Rodriguez", "Prof. Michael Chen", "Dr. Lisa Wang"],
    submissionDate: "2024-03-15",
    status: "Pending"
  },
  {
    id: "2",
    name: "David Martinez",
    email: "david.martinez@email.com",
    selections: ["Prof. James Wilson", "Dr. Emily Rodriguez", "Dr. Sarah Kim"],
    submissionDate: "2024-03-14",
    status: "Assigned"
  },
  {
    id: "3",
    name: "Emily Thompson",
    email: "emily.thompson@email.com",
    selections: ["Dr. Lisa Wang", "Prof. Michael Chen", "Dr. Robert Davis"],
    submissionDate: "2024-03-13",
    status: "Pending"
  },
  {
    id: "4",
    name: "Jason Williams",
    email: "jason.williams@email.com",
    selections: ["Dr. Sarah Kim", "Prof. James Wilson", "Dr. Maria Lopez"],
    submissionDate: "2024-03-12",
    status: "Pending"
  },
  {
    id: "5",
    name: "Rachel Green",
    email: "rachel.green@email.com",
    selections: ["Prof. Michael Chen", "Dr. Lisa Wang", "Dr. Robert Davis"],
    submissionDate: "2024-03-11",
    status: "Assigned"
  },
  {
    id: "6",
    name: "Michael Chen",
    email: "michael.chen@email.com",
    selections: ["Dr. Maria Lopez", "Prof. James Wilson", "Dr. Emily Rodriguez"],
    submissionDate: "2024-03-10",
    status: "Pending"
  },
  {
    id: "7",
    name: "Amanda Davis",
    email: "amanda.davis@email.com",
    selections: ["Dr. Sarah Kim", "Dr. Lisa Wang", "Prof. Michael Chen"],
    submissionDate: "2024-03-09",
    status: "Pending"
  },
  {
    id: "8",
    name: "James Wilson",
    email: "james.wilson@email.com",
    selections: ["Dr. Robert Davis", "Prof. James Wilson", "Dr. Maria Lopez"],
    submissionDate: "2024-03-08",
    status: "Assigned"
  },
  {
    id: "9",
    name: "Sophia Garcia",
    email: "sophia.garcia@email.com",
    selections: ["Dr. Emily Rodriguez", "Dr. Sarah Kim", "Prof. Michael Chen"],
    submissionDate: "2024-03-07",
    status: "Pending"
  },
  {
    id: "10",
    name: "Daniel Brown",
    email: "daniel.brown@email.com",
    selections: ["Dr. Lisa Wang", "Dr. Robert Davis", "Dr. Maria Lopez"],
    submissionDate: "2024-03-06",
    status: "Pending"
  },
  {
    id: "11",
    name: "Laura Kim",
    email: "laura.kim@email.com",
    selections: ["Prof. James Wilson", "Dr. Emily Rodriguez", "Dr. Sarah Kim"],
    submissionDate: "2024-03-05",
    status: "Assigned"
  },
  {
    id: "12",
    name: "Robert Taylor",
    email: "robert.taylor@email.com",
    selections: ["Dr. Maria Lopez", "Dr. Lisa Wang", "Prof. Michael Chen"],
    submissionDate: "2024-03-04",
    status: "Pending"
  }
]

const sampleAssignments: Assignment[] = [
  {
    id: "1",
    menteeName: "David Martinez",
    menteeEmail: "david.martinez@email.com",
    mentorName: "Dr. Emily Rodriguez",
    assignmentDate: "2024-03-16",
    status: "Active",
    notes: "Great match based on research interests"
  },
  {
    id: "2",
    menteeName: "Rachel Green",
    menteeEmail: "rachel.green@email.com",
    mentorName: "Dr. Lisa Wang",
    assignmentDate: "2024-03-15",
    status: "Active"
  },
  {
    id: "3",
    menteeName: "James Wilson",
    menteeEmail: "james.wilson@email.com",
    mentorName: "Prof. James Wilson",
    assignmentDate: "2024-03-14",
    status: "Completed",
    notes: "Successfully completed mentorship program"
  },
  {
    id: "4",
    menteeName: "Laura Kim",
    menteeEmail: "laura.kim@email.com",
    mentorName: "Prof. James Wilson",
    assignmentDate: "2024-03-13",
    status: "Pending"
  },
  {
    id: "5",
    menteeName: "Rachel Adams",
    menteeEmail: "rachel.adams@email.com",
    mentorName: "Dr. Maria Lopez",
    assignmentDate: "2024-03-12",
    status: "Completed"
  },
  {
    id: "6",
    menteeName: "Tom Wilson",
    menteeEmail: "tom.wilson@email.com",
    mentorName: "Dr. Sarah Kim",
    assignmentDate: "2024-03-11",
    status: "Active"
  },
  {
    id: "7",
    menteeName: "Emily Davis",
    menteeEmail: "emily.davis@email.com",
    mentorName: "Prof. Michael Chen",
    assignmentDate: "2024-03-10",
    status: "Pending"
  }
]

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>(sampleUsers)
  const [assignments, setAssignments] = useState<Assignment[]>(sampleAssignments)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [selectedMentor, setSelectedMentor] = useState<string>("")
  const [assignmentStatus, setAssignmentStatus] = useState<Assignment["status"]>("Pending")
  const [notes, setNotes] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("All")

  const filteredUsers = useMemo(() => {
    return users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [users, searchTerm])

  const filteredAssignments = useMemo(() => {
    if (statusFilter === "All") return assignments
    return assignments.filter(assignment => assignment.status === statusFilter)
  }, [assignments, statusFilter])

  const selectedUser = users.find(u => u.id === selectedUserId)

  const createAssignment = () => {
    if (!selectedUser || !selectedMentor) return

    const newAssignment: Assignment = {
      id: Date.now().toString(),
      menteeName: selectedUser.name,
      menteeEmail: selectedUser.email,
      mentorName: selectedMentor,
      assignmentDate: new Date().toISOString().split("T")[0],
      status: assignmentStatus,
      notes: notes || undefined
    }

    setAssignments([...assignments, newAssignment])
    
    // Update user status to assigned
    setUsers(users.map(u => 
      u.id === selectedUserId ? { ...u, status: "Assigned" } : u
    ))

    // Reset form
    setSelectedUserId("")
    setSelectedMentor("")
    setNotes("")

    // toast({
    //   title: "Assignment Created",
    //   description: `Successfully created assignment for ${selectedUser.name}`,
    // })
  }

  const deleteAssignment = (id: string) => {
    setAssignments(assignments.filter(a => a.id !== id))
    // toast({
    //   title: "Assignment Deleted",
    //   description: "Assignment has been successfully removed",
    //   variant: "destructive"
    // })
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Active": return "default"
      case "Completed": return "secondary"
      case "Pending": return "outline"
      default: return "outline"
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage user selections and create mentor-mentee pairings</p>
          </div>

          <div className="grid gap-8">
            {/* User Selections Section */}
            <Card className="bg-card">
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">User Mentor Selections</h2>
                
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-background"
                    />
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-medium">User Name</TableHead>
                        <TableHead className="font-medium">Email</TableHead>
                        <TableHead className="font-medium">Selected Mentors</TableHead>
                        <TableHead className="font-medium">Submission Date</TableHead>
                        <TableHead className="font-medium">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user, index) => (
                        <TableRow key={user.id} className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {user.selections.map((mentor, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {mentor}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>{user.submissionDate}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={user.status === "Assigned" ? "default" : "outline"}
                              className={user.status === "Assigned" ? "bg-emerald-100 text-emerald-800 border-emerald-200" : ""}
                            >
                              {user.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Mentor Assignments Section */}
            <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
              <Card className="bg-card">
                <CardContent className="pt-6">
                  <CardTitle className="text-xl font-semibold mb-4">Create Mentor-Mentee Pairings</CardTitle>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Select User</label>
                      <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                        <SelectTrigger className="w-full bg-background">
                          <SelectValue placeholder="Choose a user..." />
                        </SelectTrigger>
                        <SelectContent>
                          {users.filter(u => u.status === "Pending").map(user => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name} - {user.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedUser && (
                      <>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">Select Mentor</label>
                          <Select value={selectedMentor} onValueChange={setSelectedMentor}>
                            <SelectTrigger className="w-full bg-background">
                              <SelectValue placeholder="Choose a mentor..." />
                            </SelectTrigger>
                            <SelectContent>
                              {selectedUser.selections.map(mentor => (
                                <SelectItem key={mentor} value={mentor}>
                                  {mentor}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">Assignment Status</label>
                          <Select 
                            value={assignmentStatus} 
                            onValueChange={(value) => setAssignmentStatus(value as Assignment["status"])}
                          >
                            <SelectTrigger className="w-full bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="Active">Active</SelectItem>
                              <SelectItem value="Completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">Notes (Optional)</label>
                          <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Additional notes about this assignment..."
                            className="min-h-[80px] bg-background"
                          />
                        </div>

                        <Button 
                          onClick={createAssignment}
                          disabled={!selectedUserId || !selectedMentor}
                          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                        >
                          Create Assignment
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <CardTitle className="text-xl font-semibold">Current Assignments</CardTitle>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[120px] bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="-mx-2">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-medium text-sm">Mentee</TableHead>
                          <TableHead className="font-medium text-sm">Mentor</TableHead>
                          <TableHead className="font-medium text-sm">Status</TableHead>
                          <TableHead className="font-medium text-sm text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAssignments.map((assignment, index) => (
                          <TableRow key={assignment.id} className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                            <TableCell>
                              <div className="font-medium">{assignment.menteeName}</div>
                              <div className="text-xs text-muted-foreground">{assignment.menteeEmail}</div>
                            </TableCell>
                            <TableCell className="text-sm">{assignment.mentorName}</TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(assignment.status)}>
                                {assignment.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 hover:text-destructive"
                                  onClick={() => deleteAssignment(assignment.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    {filteredAssignments.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No assignments found
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}