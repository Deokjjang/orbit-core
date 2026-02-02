export type MembersHint = 'SMALL' | 'MEDIUM' | 'LARGE';

export type Item1MapRow = Readonly<{
  attractorId: string;
  summary: Readonly<{
    topAxes: ReadonlyArray<string>;
    riskDirection: 'UP' | 'DOWN' | 'FLAT';
    uncertaintyDensity: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
  membersHint: MembersHint;
}>;

export type Item1Response = Readonly<{
  requestId: string;
  itemId: 'item1';
  map: ReadonlyArray<Item1MapRow>;
  outcome: Readonly<{ label: string; scale: number }>;
  traceKinds: ReadonlyArray<string>;
}>;
