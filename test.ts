const query = (repo: string) => `
{
  repository(owner: "${owner}" ,name: "${repo}") {
    pullRequests(first: 100, baseRefName: "develop") {
      nodes {
        title
        author {
          login
        }
        state
        labels(first: 100) {
          nodes {
            name
          }
        }
        url
        createdAt
        closed
        closedAt
        merged
        mergedAt
        milestone {
          title
        }
        repository {
          name
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
}
`;

async function main() {
  try {
    const result: any = await graphqlClient(query("test"));
    const { nodes: pullRequests, pageInfo: pageInfo } =
      result["repository"]["pullRequests"];
    console.log(pullRequests);
    console.log(pageInfo);
    if (!pageInfo.hasNextPage) return;
    main();
    // for (const pr of pullRequests) {
    //   console.dir(pr);
    // }
    // for (const { node: pull } of edges) {
    //   console.log(pull);
    // }
  } catch (e) {
    console.error(e.message);
  }
}