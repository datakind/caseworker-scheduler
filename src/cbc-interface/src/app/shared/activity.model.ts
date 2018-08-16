export class Activity {
  constructor(
    public id: number,
  	public caseName: string, 
  	public activityType: string,
  	public expectedDuration: number,
  	public address: string,
  	public city: string,
  	public state: string,
  	public zipCode: string,
    public coordinates: number[],
    public completed: boolean
  ){}
}
