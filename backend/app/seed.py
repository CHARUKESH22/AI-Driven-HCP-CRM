import datetime
import sys
import os
import uuid
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add the backend directory to path so imports work correctly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.models.base import Base
from app.models.hcp import HCP
from app.models.product import Product
from app.models.interaction import Interaction, SampleDistribution
from app.models.follow_up import FollowUp

def create_database_if_not_exists():
    """Connect to default 'postgres' database and create the target db if missing."""
    db_name = settings.POSTGRES_DB
    
    # URL connecting to 'postgres' database instead of target database
    postgres_url = f"postgresql://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}/postgres"
    
    print(f"Connecting to database server at {settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}...")
    temp_engine = create_engine(postgres_url, isolation_level="AUTOCOMMIT")
    
    with temp_engine.connect() as conn:
        # Check if database exists
        result = conn.execute(text(f"SELECT 1 FROM pg_database WHERE datname = '{db_name}'"))
        exists = result.scalar()
        
        if not exists:
            print(f"Database '{db_name}' does not exist. Creating...")
            conn.execute(text(f"CREATE DATABASE {db_name}"))
            print(f"Database '{db_name}' created successfully.")
        else:
            print(f"Database '{db_name}' already exists.")
            
    temp_engine.dispose()

def seed_data():
    create_database_if_not_exists()

    db_url = settings.get_database_url()
    engine = create_engine(db_url)
    
    print("Dropping existing tables to start fresh...")
    Base.metadata.drop_all(bind=engine)
    
    print("Creating all tables based on metadata...")
    Base.metadata.create_all(bind=engine)
    
    Session = sessionmaker(bind=engine)
    db = Session()
    
    try:
        print("Seeding Products...")
        products = [
            Product(
                id=uuid.UUID("a249d375-93df-498c-8cfd-481977759d51"),
                name="GlucoSafe",
                description="Advanced glycemic control formulation for Type 2 Diabetes management. Promotes insulin sensitivity and stable HbA1c levels."
            ),
            Product(
                id=uuid.UUID("4c814b7e-97ad-45c1-8408-dbcc2c8f85f1"),
                name="CardioShield",
                description="Next-generation beta-blocker designed to manage chronic hypertension, reduce cardiac workload, and prevent secondary heart failure."
            ),
            Product(
                id=uuid.UUID("c53c4573-049e-4c3e-89a0-97509d3df361"),
                name="NeuroPlus",
                description="Cognitive enhancement and neuroprotective therapy indicated for slowing early-stage Alzheimer's disease and improving memory retention."
            ),
            Product(
                id=uuid.UUID("c4de39bc-3b02-4ec4-9dfc-27948a3c5a61"),
                name="RespiClear",
                description="Inhaled corticosteroid and long-acting bronchodilator for maintenance treatment of moderate-to-severe asthma and chronic COPD."
            ),
            Product(
                id=uuid.UUID("fa21a603-9bb6-46b2-a42e-cf66a0eb2cb3"),
                name="OsteoBond",
                description="Bisphosphonate therapy aimed at increasing bone mineral density in osteoporotic postmenopausal women to reduce risk of fractures."
            )
        ]
        db.add_all(products)
        db.commit()

        print("Seeding Healthcare Professionals (HCPs)...")
        hcps = [
            HCP(
                id=uuid.UUID("3fa85f64-5717-4562-b3fc-2c963f66afa6"),
                doctor_name="Ravi Kumar",
                specialization="Diabetologist",
                hospital="City General Hospital",
                department="Endocrinology",
                city="Chicago",
                region="Midwest",
                phone="+1-555-0199",
                email="dr.ravi.kumar@citygeneral.org",
                medical_registration="REG-12345",
                experience=12,
                preferred_visit_time="Tuesdays 10:00 AM",
                priority="A",
                products="CardioShield,GlucoSafe",
                notes="Prefers morning visits, usually available Tuesdays around 10 AM. Hospital staff is strict about pre-scheduling.",
                representative="Alex Mercer"
            ),
            HCP(
                id=uuid.UUID("68b3f24b-325b-4396-857a-9a99f1a26d7c"),
                doctor_name="Sarah Jenkins",
                specialization="Cardiologist",
                hospital="Metro Heart Institute",
                department="Cardiology",
                city="New York",
                region="Northeast",
                phone="+1-555-0144",
                email="sjenkins@metroheart.com",
                medical_registration="REG-54321",
                experience=18,
                preferred_visit_time="Afternoons 2:00 PM",
                priority="B",
                products="CardioShield",
                notes="Virtual meetings are preferred; email scheduling works best.",
                representative="Alex Mercer"
            ),
            HCP(
                id=uuid.UUID("8e44b93b-e102-491b-8025-06c8b1a5661c"),
                doctor_name="Elena Rostova",
                specialization="Neurologist",
                hospital="St. Jude Medical Center",
                department="Neurology",
                city="Boston",
                region="Northeast",
                phone="+1-555-0177",
                email="e.rostova@stjude.org",
                medical_registration="REG-98765",
                experience=8,
                preferred_visit_time="Mornings 9:00 AM",
                priority="C",
                products="NeuroPlus",
                notes="Availability is usually limited, so require bookings at least 1 week ahead.",
                representative="Alex Mercer"
            ),
            HCP(
                id=uuid.UUID("972c842b-e7b3-4f91-888e-8a07f7c46f2c"),
                doctor_name="Amit Patel",
                specialization="Pulmonologist",
                hospital="Grace Clinic",
                department="Pulmonary Medicine",
                city="Houston",
                region="South",
                phone="+1-555-0122",
                email="dr.patel@graceclinic.com",
                medical_registration="REG-11223",
                experience=15,
                preferred_visit_time="Wednesdays 11:30 AM",
                priority="A",
                products="RespiClear",
                notes="Very active researcher, interested in clinical trials.",
                representative="Alex Mercer"
            ),
            HCP(
                id=uuid.UUID("52ba831c-3b7c-48c0-827c-3f41249b6b8c"),
                doctor_name="Kenji Tanaka",
                specialization="Orthopedic",
                hospital="OrthoCare Specialist Center",
                department="Orthopedics",
                city="San Francisco",
                region="West",
                phone="+1-555-0155",
                email="k.tanaka@orthocare.jp",
                medical_registration="REG-44556",
                experience=20,
                preferred_visit_time="Thursdays 3:00 PM",
                priority="B",
                products="OsteoBond",
                notes="Prefers in-person product detailing visits.",
                representative="Alex Mercer"
            )
        ]
        db.add_all(hcps)
        db.commit()


        print("Seeding Historical Interactions...")
        # 1. Past interaction with Dr. Ravi Kumar
        int_1 = Interaction(
            id=uuid.UUID("11111111-1111-1111-1111-111111111111"),
            hcp_id=hcps[0].id,
            meeting_date=datetime.date.today() - datetime.timedelta(days=15),
            meeting_time=datetime.time(10, 30),
            meeting_type="In-Person",
            feedback="Dr. Kumar is happy with GlucoSafe patient adherence metrics, but raised questions regarding gastrointestinal side effects.",
            outcome="Agreed to review clinical trial safety data in next visit. Targetting GlucoSafe adoption for 15+ new patients.",
            summary="Discussed patient adherence and side-effect profile of GlucoSafe. Doctor expressed satisfaction with efficacy, but remains cautious about GI issues. Promising target set.",
            notes="Prefers morning visits, usually available Tuesdays around 10 AM. Hospital staff is strict about pre-scheduling."
        )
        # Link product discussed (GlucoSafe)
        int_1.products_discussed.append(products[0])
        db.add(int_1)
        db.flush()

        # Seed sample distribution for this past interaction (Distributed 5 samples of GlucoSafe)
        sample_1 = SampleDistribution(
            interaction_id=int_1.id,
            product_id=products[0].id,
            quantity=5
        )
        db.add(sample_1)

        # 2. Past interaction with Dr. Sarah Jenkins
        int_2 = Interaction(
            id=uuid.UUID("22222222-2222-2222-2222-222222222222"),
            hcp_id=hcps[1].id,
            meeting_date=datetime.date.today() - datetime.timedelta(days=30),
            meeting_time=datetime.time(14, 0),
            meeting_type="Virtual",
            feedback="Interested in CardioShield clinical trials. Wants comparison with standard ACE inhibitors.",
            outcome="Shared digital trial brochure. Will follow up with a physical copy and samples.",
            summary="Virtual meeting centered on CardioShield clinical efficacy vs ACE inhibitors. Dr. Jenkins requested head-to-head clinical data sheets.",
            notes="Virtual meetings are preferred; email scheduling works best."
        )
        int_2.products_discussed.append(products[1])
        db.add(int_2)
        db.flush()

        print("Seeding Follow-ups...")
        # Add past/upcoming follow-ups
        follow_ups = [
            # Pending follow up for Dr. Ravi Kumar
            FollowUp(
                hcp_id=hcps[0].id,
                interaction_id=int_1.id,
                follow_up_date=datetime.date.today() + datetime.timedelta(days=14),
                agenda="Discuss GlucoSafe GI tolerability statistics and share patient counseling brochures.",
                completed=False
            ),
            # Completed follow up for Dr. Sarah Jenkins (virtual meeting was the follow-up)
            FollowUp(
                hcp_id=hcps[1].id,
                interaction_id=int_2.id,
                follow_up_date=datetime.date.today() - datetime.timedelta(days=30),
                agenda="Introduce CardioShield and set up virtual session.",
                completed=True
            ),
            # New upcoming follow-up for Dr. Elena Rostova
            FollowUp(
                hcp_id=hcps[2].id,
                follow_up_date=datetime.date.today() + datetime.timedelta(days=5),
                agenda="Introduce NeuroPlus to the geriatric department head.",
                completed=False
            )
        ]
        db.add_all(follow_ups)
        
        db.commit()
        print("Database initialized and mock data seeded successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}", file=sys.stderr)
        raise
    finally:
        db.close()
        engine.dispose()

if __name__ == "__main__":
    seed_data()
