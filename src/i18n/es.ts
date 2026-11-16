// All Spanish UI strings live here.
export const es = {
  appTitle: 'CyberShield',
  appSubtitle: 'Defensa de subestaciones',
  setupReady: 'Entorno listo',
  placeholderBadge: 'Datos de prueba',
  schemaErrors: {
    emptyText: 'El texto no puede estar vacío',
    emptySteps: 'La ruta debe tener al menos un paso',
    emptyBlocks: 'El control debe bloquear al menos un paso',
    duplicateId: (collection: string, id: string) => `Id repetido en ${collection}: "${id}"`,
    unknownAsset: (routeId: string, assetId: string) =>
      `La ruta "${routeId}" usa el activo "${assetId}", que no existe en assets`,
    unknownRoute: (controlId: string, routeId: string) =>
      `El control "${controlId}" bloquea la ruta "${routeId}", que no existe en routes`,
    invalidStepIndex: (controlId: string, routeId: string, stepIndex: number, length: number) =>
      `El control "${controlId}" usa stepIndex ${stepIndex} en la ruta "${routeId}", ` +
      `pero debe estar entre 0 y ${length - 1}`,
    duplicateOutcome: (level: string) => `Nivel repetido en outcomes: ${level}`,
    missingOutcome: (level: number) =>
      `Falta un outcome para el nivel ${level}, que es usado por las rutas`,
    budgetTooLarge: (budget: number, count: number) =>
      `defenderBudget (${budget}) es mayor que el número de controles (${count})`,
  },
} as const;
