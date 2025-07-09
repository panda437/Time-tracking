declare module "@microsoft/clarity" {
  const clarity: {
    init: (projectId: string) => void
    setTag?: (...args: any[]) => void
    identify?: (...args: any[]) => void
    consent?: (...args: any[]) => void
    upgrade?: (...args: any[]) => void
    event?: (...args: any[]) => void
  }
  export default clarity
} 