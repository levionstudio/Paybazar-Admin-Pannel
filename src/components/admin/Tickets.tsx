import { useState, useEffect } from "react"
import { jwtDecode } from "jwt-decode"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "@/hooks/use-toast"
import { Loader2, RefreshCw, Mail, Phone, User, ChevronDown, ChevronUp } from "lucide-react"

interface Ticket {
  admin_id: string
  name: string
  subject: string
  mobile: string
  email: string
  message: string
}

interface JWTPayload {
  data: { admin_id: string; [key: string]: any }
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://64.227.165.232:8080"

export function Tickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set())
  const itemsPerPage = 10

  const getAdminId = (): string | null => {
    try {
      const token = localStorage.getItem("authToken")
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication token not found",
          variant: "destructive",
        })
        return null
      }
      const decoded = jwtDecode<JWTPayload>(token)
      return decoded.data.admin_id
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid authentication token",
        variant: "destructive",
      })
      return null
    }
  }

  const fetchTickets = async () => {
    setLoading(true)
    const adminId = getAdminId()
    if (!adminId) {
      setLoading(false)
      return
    }

    try {
      const response = await axios.get(
        `${API_BASE_URL}/admin/get/tickets/${adminId}`
      )
      const data = response.data.data.tickets

      // Safely handle null or undefined
      setTickets(Array.isArray(data) ? data : [])

      toast({
        title: "Success",
        description: "Tickets loaded successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to fetch tickets",
        variant: "destructive",
      })
      setTickets([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  const totalPages = Math.ceil(tickets.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedTickets = tickets.slice(startIndex, endIndex)

  const toggleMessage = (index: number) => {
    setExpandedMessages((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const isMessageLong = (message: string) => {
    return message.length > 100
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Support Tickets</h1>
          <p className="text-muted-foreground mt-1">
            Manage customer support tickets
          </p>
        </div>
        <Button onClick={fetchTickets} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="pl-8">All Tickets</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div>
            <div className="max-h-[600px] max-w-6xl overflow-y-auto pl-10">
              <Table className="w-full">
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="text-center whitespace-nowrap">
                      Name
                    </TableHead>
                    <TableHead className="text-center whitespace-nowrap">
                      Subject
                    </TableHead>
                    <TableHead className="text-center whitespace-nowrap">
                      Mobile
                    </TableHead>
                    <TableHead className="text-center whitespace-nowrap">
                      Email
                    </TableHead>
                    <TableHead className="text-center whitespace-nowrap">
                      Message
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTickets.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-muted-foreground py-8"
                      >
                        No tickets found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedTickets.map((ticket, index) => (
                      <TableRow key={`${ticket.email}-${index}`}>
                        <TableCell className="font-medium text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {ticket.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-semibold">
                          {ticket.subject}
                        </TableCell>
                        <TableCell className="text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            {ticket.mobile}
                          </div>
                        </TableCell>
                        <TableCell className="text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {ticket.email}
                          </div>
                        </TableCell>
                        <TableCell className="text-center max-w-md">
                          <div className="text-left px-2">
                            {isMessageLong(ticket.message) ? (
                              <>
                                <p className={expandedMessages.has(startIndex + index) ? "" : "line-clamp-2"}>
                                  {ticket.message}
                                </p>
                                <button
                                  onClick={() => toggleMessage(startIndex + index)}
                                  className="text-primary hover:underline text-sm mt-1 flex items-center gap-1"
                                >
                                  {expandedMessages.has(startIndex + index) ? (
                                    <>
                                      Read Less <ChevronUp className="h-3 w-3" />
                                    </>
                                  ) : (
                                    <>
                                      Read More <ChevronDown className="h-3 w-3" />
                                    </>
                                  )}
                                </button>
                              </>
                            ) : (
                              <p>{ticket.message}</p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>

        {tickets.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, tickets.length)}{" "}
              of {tickets.length} tickets
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-10"
                    >
                      {page}
                    </Button>
                  )
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}