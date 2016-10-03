import { GraphQLSchema, GraphQLFieldConfig } from 'graphql'
import { Inventory, ObjectType } from '../../interface'
import getCollectionGQLType from './collection/getCollectionGQLType'
import BuildToken from './BuildToken'
import getQueryGQLType from './getQueryGQLType'
import getMutationGQLType from './getMutationGQLType'

export type SchemaOptions = {
  // The exact name for the node id field. In the past Relay wanted this to
  // be `id`, but there are some movements in the GraphQL standard to
  // standardize an `__id` field.
  nodeIdFieldName?: string,
  // TODO: doc
  _queryFieldEntries?: () => Array<[string, GraphQLFieldConfig<mixed, mixed>]>,
  _mutationFieldEntries?: () => Array<[string, GraphQLFieldConfig<mixed, mixed>]>,
  _objectTypeFieldEntries?: (type: ObjectType) => Array<[string, GraphQLFieldConfig<ObjectType.Value, mixed>]>,
}

/**
 * Creates a GraphQL schema using an instance of `Inventory`.
 */
export default function createGQLSchema (inventory: Inventory, options: SchemaOptions = {}): GraphQLSchema {
  // We take our user-friendly arguments to `createGraphqlSchema` and convert them
  // into a build token. One nice side effect of always creating our own
  // build token object is that we have the guarantee that every build token
  // will always maintain its own memoization map.
  const buildToken: BuildToken = {
    inventory,
    options: {
      // The default node id field name is `__id` as it is the emerging
      // standard.
      nodeIdFieldName: options.nodeIdFieldName || '__id',
    },
    _hooks: {
      // Add the hooks to the build token and add default implementations if
      // they do not exist.
      queryFieldEntries: options._queryFieldEntries || (() => []),
      mutationFieldEntries: options._mutationFieldEntries || (() => []),
      objectTypeFieldEntries: options._objectTypeFieldEntries || (() => []),
    },
  }

  return new GraphQLSchema({
    query: getQueryGQLType(buildToken),
    mutation: getMutationGQLType(buildToken),
    types: [
      // Make sure to always include the types for our collections, even if
      // they have no other output.
      ...inventory.getCollections().map(collection => getCollectionGQLType(buildToken, collection)),
    ],
  })
}