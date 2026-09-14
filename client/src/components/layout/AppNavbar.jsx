import { useState } from 'react'
import { Container, Nav, Navbar, NavDropdown } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import { BarChartFill, ClipboardCheckFill, DoorClosedFill, GearFill, HouseDoorFill, PersonCircle } from 'react-bootstrap-icons'
import { useAuth } from '../../context/AuthContext.jsx'

export default function AppNavbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  // react-bootstrap's collapsed mobile menu doesn't close itself when a link
  // inside it is clicked, so a tap on e.g. "Dashboard" navigates underneath
  // the still-open menu and looks like it did nothing. Controlling
  // `expanded` and closing it on every link click fixes that.
  const [expanded, setExpanded] = useState(false)
  const close = () => setExpanded(false)

  if (!user) return null

  const handleLogout = async () => {
    close()
    await logout()
    navigate('/login')
  }

  return (
    <Navbar bg="primary" variant="dark" expand="sm" className="mb-3" sticky="top" expanded={expanded} onToggle={setExpanded}>
      <Container fluid>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center gap-2" onClick={close}>
          <DoorClosedFill /> Room Inspections
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-nav" />
        <Navbar.Collapse id="main-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/" className="d-flex align-items-center gap-1" onClick={close}>
              <HouseDoorFill /> Dashboard
            </Nav.Link>
            <Nav.Link as={Link} to="/reports" className="d-flex align-items-center gap-1" onClick={close}>
              <BarChartFill /> Reports
            </Nav.Link>
            <Nav.Link as={Link} to="/bulk-backdate" className="d-flex align-items-center gap-1" onClick={close}>
              <ClipboardCheckFill /> Bulk Backdate
            </Nav.Link>
            <Nav.Link as={Link} to="/settings/rooms" className="d-flex align-items-center gap-1" onClick={close}>
              <GearFill /> Rooms
            </Nav.Link>
          </Nav>
          <Nav>
            <NavDropdown
              title={
                <span className="d-inline-flex align-items-center gap-1">
                  <PersonCircle /> {user.displayName}
                </span>
              }
              id="user-menu"
              align="end"
            >
              <NavDropdown.Item onClick={handleLogout}>Log out</NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}
