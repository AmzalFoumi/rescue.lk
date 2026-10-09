// There is no login in this project (it is not part of the assignment), so the
// response screens act as one demo officer.

export interface OfficerIdentity {
  id: string;
  name: string;
}

export const DEMO_OFFICER: OfficerIdentity = {
  id: 'officer-sp',
  name: 'S. Perera',
};

/** A name to show for a person id. Ids we do not know are shown as they are. */
export function officerName(id: string): string {
  return id === DEMO_OFFICER.id ? DEMO_OFFICER.name : id;
}
