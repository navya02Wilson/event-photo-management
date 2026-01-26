/**
 * Event Model
 * Entity definition for Event
 */

class Event {
	constructor({
		id,
		eventName,
		userId,
		storageProviderId,
		storageFolderId,
		eventDate,
		qrCodeUrl,
		status,
		createdAt,
		createdBy,
		updatedAt,
		updatedBy,
	}) {
		this.id = id;
		this.eventName = eventName;
		this.userId = userId;
		this.storageProviderId = storageProviderId;
		this.storageFolderId = storageFolderId;
		this.eventDate = eventDate;
		this.qrCodeUrl = qrCodeUrl;
		this.status = status;
		this.createdAt = createdAt;
		this.createdBy = createdBy;
		this.updatedAt = updatedAt;
		this.updatedBy = updatedBy;
	}

	/**
	 * Convert event to JSON
	 * @returns {Object} Event object
	 */
	toJSON() {
		return {
			id: this.id,
			eventName: this.eventName,
			userId: this.userId,
			storageProviderId: this.storageProviderId,
			storageFolderId: this.storageFolderId,
			eventDate: this.eventDate,
			qrCodeUrl: this.qrCodeUrl,
			status: this.status,
			createdAt: this.createdAt,
			createdBy: this.createdBy,
			updatedAt: this.updatedAt,
			updatedBy: this.updatedBy,
		};
	}
}

module.exports = Event;













