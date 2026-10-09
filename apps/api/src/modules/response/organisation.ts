/**
 * Who owns a resource. The case study requires a combined view of resources
 * owned by government bodies, the armed forces, NGOs and private donors.
 */
export enum OrganisationKind {
  Government = 'government',
  ArmedForces = 'armed_forces',
  Ngo = 'ngo',
  PrivateDonor = 'private_donor',
}

/**
 * The owner of a rescue team or a shelter, as the officer sees it in the
 * combined list. The name and kind are copied onto the resource so one query
 * can show every organisation's resources side by side.
 */
export interface Owner {
  organisationId: string;
  name: string;
  kind: OrganisationKind;
}
