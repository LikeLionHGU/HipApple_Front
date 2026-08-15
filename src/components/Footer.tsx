import farmsignLogo from '../assets/팜사인_로고.svg'
import './Footer.css'

const TEAM = [
  { role: 'Team', members: ['멋쟁이사과'] },
  { role: 'Planner', members: ['최서연'] },
  { role: 'Designer', members: ['현하나'] },
  { role: 'Frontend', members: ['박형찬', '윤유원'] },
  { role: 'Backend', members: ['조나은', '박주아'] },
]

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <img className="footer-logo" src={farmsignLogo} alt="팜사인 로고" />
          <p className="footer-tagline">AI 기반 사과 출하시기 의사결정 플랫폼</p>
          <p className="footer-copyright">© 2026 FarmSign. All rights reserved.</p>
        </div>

        <div className="footer-team">
          {TEAM.map(group => (
            <dl className="footer-team-group" key={group.role}>
              <dt>{group.role}</dt>
              {group.members.map(member => (
                <dd key={member}>{member}</dd>
              ))}
            </dl>
          ))}
        </div>
      </div>
      <div className="footer-accent" aria-hidden="true" />
    </footer>
  )
}
