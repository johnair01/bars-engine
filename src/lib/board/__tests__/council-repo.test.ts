import { councilRepoHeaders } from '../council-repo'

describe('councilRepoHeaders', () => {
  it('sends the read token as a bearer header when it is set', () => {
    expect(councilRepoHeaders({ COUNCIL_REPO_READ_TOKEN: 'abc' } as NodeJS.ProcessEnv)).toEqual({ Authorization: 'Bearer abc' })
  })
  it('sends nothing when it is not set', () => {
    expect(councilRepoHeaders({} as NodeJS.ProcessEnv)).toEqual({})
  })
})
