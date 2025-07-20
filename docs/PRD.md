Product Requirements Document: Church Connect - Parish & Household Map (Desktop Web)
1. Introduction
This document outlines the product requirements for "Church Connect," a secure, private desktop web application designed to create a living map of the church's congregation. The application's primary purpose is to strengthen the bonds of fellowship within the parish by helping members connect names, faces, and families with households. Instead of a simple list, this tool provides a visual representation of the church community, allowing members to see where fellow parishioners live, learn about their families, and feel more connected as a unified church family.
2. Goals and Objectives
Primary Goal 1: To deepen the sense of fellowship and transform the congregation into a more tightly-knit church family by facilitating recognition and connection between households.
Primary Goal 2: To provide a secure and intuitive visual directory that helps members, ministry leaders, and staff better understand and support the parish community.
User Objectives:
Easily find and identify the households of fellow church members.
Put faces to names for the entire family, not just one individual.
Feel a stronger sense of belonging by seeing their own family's place on the community map.
Church Leadership Objectives:
Increase engagement and a sense of belonging among the congregation.
Provide a powerful tool for pastoral care, welcome ministries, and small group organization.
Foster a community where members are more likely to support one another.
3. Target Audience
The application is for the exclusive use of registered members of the church. Access will be password-protected.
4. Features and Functionality
4.1. The Parish Map
Initial Map Display: Upon secure login, the map loads centered on the church's location or a predefined parish boundary, showing all member households.
Household Markers: Each pin on the map represents one household address.
The marker icon will feature a photo of the Head(s) of Household.
The marker for the logged-in user's own household will be visually distinct (e.g., a golden halo or star) to anchor them on the map.
Hover Interaction: Hovering the mouse over a household marker reveals a tooltip with the family name (e.g., "The Garcia Family").
4.2. The Household Profile Popover
On-Click Popover: Clicking a household marker opens a detailed popover, designed to introduce the entire family.
Popover Content:
Family Name: Displayed prominently at the top (e.g., "The Johnson Family").
Household Address.
Family Photo (Optional): A main photo of the entire family together.
Family Members List: A dedicated section listing each member of the household. Each entry includes:
Member's Photo
First Name
Role in household (e.g., "Spouse," "Child").
Household Bio/Greeting: A short, warm message from the family to the church community (e.g., "We've been members since 2018 and love being part of the choir!").
Ministry Involvement: Tags or icons indicating which ministries the family or its members are involved in (e.g., "Youth Group," "Welcome Committee," "Music Ministry").

4.3. Administrative Features
Admin-Only Access: A designated administrator will have access to features for managing household data.
Add New Household:
An "Add New Family" button, visible only to the admin, will open a data entry form.
The form will include fields for all household information: family name, bio, ministry involvement, address, and a family photo upload.
It will allow for the dynamic addition of individual family members with their name and role.
Geocoding: The system will automatically convert the entered address into map coordinates (latitude and longitude).
Data Persistence: Upon submission, the new household's information will be saved to the application's data source, and the photo will be stored in the appropriate directory.

5. User Flow
A church member securely logs into the Church Connect web portal.
The parish map loads, showing household markers across the area. They immediately see their own highlighted marker.
They see a marker for a family they recognize from the church service and hover over it. The tooltip "The Abebe Family" appears.
They click the marker to learn more.
The Household Profile Popover appears. It shows "The Abebe Family," their family photo, and lists the parents and their two children with individual photos and names. They see a note that the family is involved in the food pantry ministry.
The member now feels a much stronger connection, able to greet the entire family by name next Sunday.
6. Technical Requirements
Platform: Secure Desktop Web Browsers (latest versions of Chrome, Firefox, Safari, Edge).
Data Structure: The database must be structured around a Household entity. Each Household has one address and contains a one-to-many relationship with Member entities.
API: A secure, authenticated API to fetch household and nested member data. Unauthorized requests must be rejected.
Mapping Service: Google Maps API (Maps JavaScript API).
Privacy & Security:
Secure Login: All access must be behind a mandatory, secure login system (user/pass).
Data Privacy: No information is public. The application and its data must not be indexable by search engines.
7. Design and User Experience (UX)
Warm & Welcoming Design: The aesthetic should feel like an extension of the church—warm, trustworthy, and community-focused.
Clarity of Information: The Household Popover must be expertly designed to present family information clearly without feeling cluttered.
Privacy-Conscious: Users should feel in complete control of their information. It must be clear that this is a private, internal church tool.
Encouraging Participation: The UI should gently encourage families to upload photos and fill out their profiles to make the directory more vibrant and useful for everyone.
8. Success Metrics
Household Profile Completion Rate: Percentage of households that have uploaded photos for their members and a family bio. This is the key metric for user buy-in.
Active Use: Number of members logging in per week/month to use the tool.
Qualitative Feedback: Testimonials from members and ministry leaders about how the tool has helped them build connections.
9. Future Considerations
Member-Owned Business Map: A toggle to switch to a view showing businesses owned by church members, allowing the congregation to support each other economically. The popover would show business details and a link back to the owner's household profile.
Ministry & Small Group Filters: Allow users to filter the map to see all members of a specific ministry, committee, or small group, helping leaders visualize their teams.
"Welcome New Families" Feature: A special, temporary icon for households that have recently joined the church, encouraging existing members to reach out and welcome them.
Printable Directory: A feature to generate a classic, printable PDF photo directory from the existing data for members who prefer a physical copy.