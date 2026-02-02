export type RiskTier = 'LOW' | 'MEDIUM' | 'HIGH';

export type Item2RiskRow = Readonly<{
  attractorId: string;
  tier: RiskTier;
  direction: 'UP' | 'DOWN' | 'FLAT';
}>;

export type Item2Response = Readonly<{
  requestId: string;
  itemId: 'item2';
  risk: ReadonlyArray<Item2RiskRow>;
}>;
