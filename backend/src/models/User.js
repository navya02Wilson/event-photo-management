/**
 * User Model
 * Entity definition for User
 */

class User {
	constructor({
		id,
		name,
		email,
		password,
		isActive,
		status,
		createdAt,
		createdBy,
		updatedAt,
		updatedBy,
		roles = [],
	}) {
		this.id = id;
		this.name = name;
		this.email = email;
		this.password = password;
		this.isActive = isActive;
		this.status = status;
		this.createdAt = createdAt;
		this.createdBy = createdBy;
		this.updatedAt = updatedAt;
		this.updatedBy = updatedBy;
		this.roles = roles;
	}

	/**
	 * Convert user to JSON (exclude password)
	 * @returns {Object} User object without password
	 */
	toJSON() {
		const { password, ...user } = this;
		return user;
	}
}

module.exports = User;




