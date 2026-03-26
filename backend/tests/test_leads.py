import json


class TestCreateLead:
    """Tests for POST /api/leads endpoint."""

    def test_create_lead_valid_email(self, client, db):
        """POST /api/leads with valid email returns 201 and id."""
        response = client.post(
            '/api/leads',
            data=json.dumps({'email': 'valid@example.com'}),
            content_type='application/json',
        )
        assert response.status_code == 201
        data = response.get_json()
        assert 'id' in data
        assert data['message'] == 'Lead created successfully'

    def test_create_lead_duplicate_email(self, client, db):
        """POST /api/leads with duplicate email returns 200 and message."""
        payload = json.dumps({'email': 'duplicate@example.com'})
        # First request creates the lead
        client.post('/api/leads', data=payload, content_type='application/json')
        # Second request should return 200
        response = client.post(
            '/api/leads', data=payload, content_type='application/json'
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data['message'] == 'Email already registered'

    def test_create_lead_invalid_email(self, client, db):
        """POST /api/leads with invalid email returns 400."""
        response = client.post(
            '/api/leads',
            data=json.dumps({'email': 'not-an-email'}),
            content_type='application/json',
        )
        assert response.status_code == 400
        data = response.get_json()
        assert data['error'] == 'validation_error'
        assert 'email' in data['messages']

    def test_create_lead_missing_email(self, client, db):
        """POST /api/leads with missing email field returns 400."""
        response = client.post(
            '/api/leads',
            data=json.dumps({'source': 'test'}),
            content_type='application/json',
        )
        assert response.status_code == 400
        data = response.get_json()
        assert data['error'] == 'validation_error'
        assert 'email' in data['messages']

    def test_create_lead_empty_body(self, client, db):
        """POST /api/leads with empty body returns 400."""
        response = client.post(
            '/api/leads',
            data='',
            content_type='application/json',
        )
        assert response.status_code == 400
        data = response.get_json()
        assert data['error'] == 'validation_error'
