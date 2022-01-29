## Bug Tracking System

# Bug
- project: string
- raised: boolean 
- resolved: boolean
- threatLevel: num (1-3)
- deadlineResolving: date
- comments: Comments

# Comments
- User: User
- body: string
 
# Project
- team: Team
- bugs: bugs
 
# Team 
- leader: Employee
- employees: Employee
- project: Project[]

# Employee (ISA User)
- username: string
- password: string
- isLeader: boolean
- role: bugs
 
# Tester (ISA User)
- username: string
- password: string

## Pages:
# Sign in page
# Register page

# Navbar
- Dashboard
- Admin
- Signout

# Admin page
- Leader can add employees

# Dashboard page
- Project name, description, members, noOfPendingbugs
- On project click shows all bugs related to project
- Bug desc

- User/Employee can view projects
- Team leader can view/add projects
- Stats graph of bugs data for a given project

# Bugs:id page


