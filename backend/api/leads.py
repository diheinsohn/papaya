from flask import Blueprint, request
from extensions import db
from models.lead import Lead
from schemas.lead_schema import LeadCreateSchema

leads_bp = Blueprint('leads', __name__)
lead_schema = LeadCreateSchema()


@leads_bp.route('/leads', methods=['POST'])
def create_lead():
    json_data = request.get_json(silent=True)
    if json_data is None:
        return {'error': 'validation_error', 'messages': {'_schema': ['Invalid or missing JSON body']}}, 400

    errors = lead_schema.validate(json_data)
    if errors:
        return {'error': 'validation_error', 'messages': errors}, 400

    data = lead_schema.load(json_data)

    # Check for duplicate
    existing = Lead.query.filter_by(email=data['email']).first()
    if existing:
        return {'message': 'Email already registered'}, 200

    lead = Lead(email=data['email'], source=data.get('source', 'landing'))
    db.session.add(lead)
    db.session.commit()

    return {'message': 'Lead created successfully', 'id': lead.id}, 201
