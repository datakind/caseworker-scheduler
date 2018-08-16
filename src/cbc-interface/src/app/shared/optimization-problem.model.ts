export class OptimizationProblem {
  constructor(
    public objective: string,
    public hours: object,
    public constraints: OrderConstraint[],
    public deadlines: Deadline[],
    public groups: Group[]
){}
}

export class OrderConstraint {
  constructor(
    public firstActivity: string,
    public order: string,
    public secondActivity: string
  ){}
}

export class Deadline {
  constructor(
    public activity: string,
    public dueDate: string
  ){}
}

export class Group {
  constructor(
    public activity1: string,
    public activity2: string
  ){}
}