import { NextResponse } from 'next/server';
// import { connectToDB } from '@/lib/mongoose';
import { connectToDatabase } from '@/lib/db';
import Registration from '@/app/models/user.models';

// Connect to MongoDB
connectToDatabase();

// Type definitions matching your data structure
type TeamMember = {
  name: string;
  email: string;
};

type Event = {
  id: string;
  title: string;
};

type RegistrationData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  college: string;
  specialRequirements: string;
  agreeToTerms: boolean;
  teamMembers: TeamMember[];
  events: Event[];
};

export async function POST(request: Request) {
  try {
    const body: RegistrationData = await request.json();
    const { 
      firstName,
      lastName,
      email,
      phone,
      college,
      specialRequirements,
      agreeToTerms,
      teamMembers,
      events
    } = body;

    // Verify terms agreement
    if (!agreeToTerms) {
      return NextResponse.json(
        { success: false, message: 'You must agree to the terms and conditions' },
        { status: 400 }
      );
    }

    // Check for existing registrations for any of the events
    const existingRegistrations = await Registration.find({
      'primaryParticipant.email': email,
      'events.id': { $in: events.map(e => e.id) }
    });

    if (existingRegistrations.length > 0) {
      const registeredEvents = existingRegistrations.map(reg => 
        reg.events.map((e:Event) => e.title)
      ).flat();
      
      return NextResponse.json(
        { 
          success: false, 
          message: `This email is already registered for: ${registeredEvents.join(', ')}`,
          registeredEvents
        },
        { status: 400 }
      );
    }

    // Create a registration document for each event
    const registrationPromises = events.map(async (event) => {
      const registration = new Registration({
        primaryParticipant: {
          name: `${firstName} ${lastName}`,
          email,
          phone,
          college
        },
        teamMembers: teamMembers.map(member => ({
          ...member,
          phone: '', // You might want to collect phone for team members too
          college: college // Default to primary participant's college
        })),
        specialRequirements,
        events: [event], // Store each event separately
        agreeToTerms,
        registrationDate: new Date()
      });

      return registration.save();
    });

    const savedRegistrations = await Promise.all(registrationPromises);

    return NextResponse.json(
      { 
        success: true, 
        data: savedRegistrations,
        message: `Successfully registered for ${events.length} events`
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const eventId = searchParams.get('eventId');

    if (email && eventId) {
      // Check registration status for specific event
      const registration = await Registration.findOne({
        'primaryParticipant.email': email,
        'events.id': eventId
      });

      return NextResponse.json({
        success: true,
        isRegistered: !!registration,
        registrationData: registration
      });
    } else if (email) {
      // Get all registrations for this email
      const registrations = await Registration.find({
        'primaryParticipant.email': email
      });
      
      return NextResponse.json({
        success: true,
        count: registrations.length,
        registeredEvents: registrations.flatMap(reg => reg.events)
      });
    } else {
      // Get all registrations (admin only)
      const registrations = await Registration.find();
      return NextResponse.json({
        success: true,
        count: registrations.length,
        data: registrations
      });
    }
  } catch (error) {
    console.error('Get registrations error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}