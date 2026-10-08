// There is no login in this project (it is not part of the assignment), so the
// app acts as one demo citizen and one demo operator.

export interface CitizenIdentity {
  id: string;
  name: string;
  /** The citizen's home district. GPS reports are filed under it. */
  districtName: string;
}

export interface OperatorIdentity {
  id: string;
  name: string;
}

export const DEMO_CITIZEN: CitizenIdentity = {
  id: 'citizen-nimal',
  name: 'Nimal Perera',
  districtName: 'Ratnapura',
};

export const DEMO_OPERATOR: OperatorIdentity = {
  id: 'operator-kj',
  name: 'K. Jayawardena',
};

/** A name to show for a person id. Ids that are not the demo operator are shown as they are. */
export function displayName(id: string): string {
  if (id === DEMO_OPERATOR.id) return DEMO_OPERATOR.name;
  if (id === DEMO_CITIZEN.id) return DEMO_CITIZEN.name;
  return id;
}
