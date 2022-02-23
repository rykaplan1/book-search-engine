const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
  Query: {
    me: async (parent, { username }) => {
      return User.findOne({ username });
    },
  },

  Mutation: {
    addUser: async (parent, { username, email, password }) => {
      const user = await User.create({ username, email, password });
      const token = signToken(user);
      return { token, user };
    },

    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError('No user found with this email address');
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError('Incorrect credentials');
      }

      const token = signToken(user);

      return { token, user };
    },

    saveBook: async (parent, { authors, description, bookId, image, link, title }, context) => {
      if (context.user) {
        return User.findOneAndUpdate(
          { _id: context.user._id},
          { $addToSet: { savedBooks: { authors, description, bookId, image, link, title }}},
          {
            new: true,
            runValidators: true,
          }
        );
      }
      throw new AuthenticationError('You need to be logged in!');
    },

    removeBook: async (parent, { user, bookId }, context) => {
      if (context.user) {
        return User.findOneAndUpdate(
          { _id: user._id},
          {
            $pull: {
              savedBooks: {
                bookId: bookId
              }
            }
          },
          { new: true }
        );
      }
      throw new AuthenticationError('You need to be logged in!');
    }
  },
};


module.exports = resolvers;