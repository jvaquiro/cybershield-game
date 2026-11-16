// All Spanish UI strings live here.
const pct = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 });
const formatPercent = (value: number) => `${pct.format(value)} %`;
/** "Correo de phishing" → "correo de phishing"; acronyms such as "USB o ..." stay as they are. */
const lowerFirst = (text: string) =>
  /^\p{Lu}\p{Ll}/u.test(text) ? text.charAt(0).toLowerCase() + text.slice(1) : text;

export const es = {
  appTitle: 'CyberShield',
  placeholderBadge: 'Datos de prueba',
  formatPercent,

  start: {
    subtitle: 'Una ciudad encendida depende de una infraestructura protegida',
    begin: 'Comenzar',
  },

  levels: {
    4: 'Red empresarial',
    3: 'Operaciones',
    2: 'Supervisión',
    1: 'Control',
    0: 'Proceso',
  } as Record<number, string>,
  levelLabel: (level: number) => `Nivel ${level}`,

  map: {
    title: 'Mapa de la subestación',
    hint: 'Toca un activo para ver su información',
    next: 'Elegir defensa',
    ariaLabel: 'Mapa de la subestación por niveles Purdue',
  },

  assetCard: {
    level: 'Nivel',
    protocol: 'Protocolo',
    risk: 'Riesgo',
    riskFormula: (probability: number, impact: number, risk: number) =>
      `Probabilidad ${probability} × Impacto ${impact} = ${risk}`,
    close: 'Cerrar',
  },

  defense: {
    title: 'Elige tu defensa',
    hint: (budget: number) => (budget === 1 ? 'Elige 1 control' : `Elige ${budget} controles`),
    selected: (count: number, budget: number) => `Elegidos: ${count} de ${budget}`,
    protects: 'Protege',
    back: 'Volver al mapa',
    simulate: 'Simular',
  },

  result: {
    title: 'Resultado del ataque',
    attackTitle: 'Así avanzó el ataque',
    attackHint: 'Rojo: activos alcanzados · Verde: punto de bloqueo',
    showRisk: 'Ver el riesgo',
    showAttack: 'Ver el ataque',
    route: 'Ruta',
    before: 'Antes',
    after: 'Después',
    stoppedBy: (control: string) => `Detenido por ${control}`,
    notStopped: 'Sin bloquear',
    totalRisk: 'Riesgo total',
    reduction: (value: number, percent: number) =>
      `Reducción: ${value} (${formatPercent(percent)})`,
    cityOn: (percent: number) => `Ciudad encendida: ${formatPercent(percent)}`,
    cityScenario: (entry: string) => `Si el atacante entra por ${lowerFirst(entry)}`,
    cityAria: (percent: number) => `${formatPercent(percent)} de la ciudad sigue con luz`,
    recommendation: 'Recomendación de CyberShield',
    yourChoice: 'Tu defensa',
    match: '¡Tu defensa coincide con la recomendación!',
    equivalent: 'Tu defensa protege igual que la recomendación.',
    whyLowerRisk: (rec: string, recRisk: number, userRisk: number) =>
      `${rec} deja un riesgo de ${recRisk} en vez de ${userRisk}: el atacante alcanza menos activos.`,
    whyMoreRoutes: (rec: string) => `${rec} deja el mismo riesgo, pero bloquea más rutas.`,
    whyEarlier: (rec: string) =>
      `${rec} deja el mismo riesgo, pero detiene el ataque antes, más cerca de la entrada.`,
    retry: 'Probar otra defensa',
    home: 'Volver al inicio',
  },

  dataError: {
    title: 'Error en los datos de la subestación',
    hint: 'Revisa el archivo src/data/subestacion.json',
  },

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
