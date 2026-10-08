// The kinds of hazard a reporter can choose from the report form.
export enum HazardType {
  Flood = 'flood',
  Landslide = 'landslide',
  RoadBlockage = 'road_blockage',
  Fire = 'fire',
  Other = 'other',
}

// Who is sending the report (the Reporter subtypes in the class diagram).
export enum ReporterRole {
  Citizen = 'citizen',
  CommunityVolunteer = 'community_volunteer',
  GroundLevelOfficer = 'ground_level_officer',
}
